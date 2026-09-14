import { useCallback, useEffect, useRef, useState } from 'react';
import type { CaseId, Job, JobStatus } from '../../types';
import { TERMINAL_STATUSES } from '../../types';
import { getJob, submitCall } from '../../api/calls';
import { ApiError } from '../../api/client';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Ключ хранения списка заданий: сервер не отдаёт список, только по job_id. */
const JOBS_KEY = 'echostress.jobs';

/**
 * Ключ последней отправки: какие задания показывать в блоке над списком.
 * Переживает перезагрузку страницы вместе с самим списком, иначе блок
 * пропадал бы при обновлении, пока запись ещё считается.
 */
const WATCH_KEY = 'echostress.jobs.watch';

/**
 * Шаг опроса.
 *
 * Обработка идёт минутами: эталонная запись в 331 секунду считается
 * около 70 секунд, длинная — дольше. Частый опрос первые полминуты
 * нужен, чтобы статус «В очереди» сменился на «Обработка» при человеке;
 * дальше он только нагружает сервис, поэтому интервал растёт.
 */
const POLL_STEPS_MS = [3000, 5000, 10000, 15000];

/**
 * Контракт не предусматривает ручку «все мои задания»: состояние
 * запрашивается по конкретному job_id. Поэтому список загруженных
 * записей ведёт сам клиент, а актуальные статусы подтягиваются
 * опросом. При смене браузера или чистке хранилища список опустеет —
 * это ограничение контракта, а не хранения.
 */
function loadJobIds(): string[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveJobIds(ids: string[]): void {
  localStorage.setItem(JOBS_KEY, JSON.stringify(ids));
}

function loadWatchIds(): string[] {
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveWatchIds(ids: string[]): void {
  localStorage.setItem(WATCH_KEY, JSON.stringify(ids));
}

/**
 * Ключ журнала событий.
 *
 * Журнал хранится рядом со списком заданий, а не в памяти вкладки:
 * обработка идёт минутами, за это время страницу успевают обновить, и
 * терять при этом отсчёт и всю историю записи нельзя.
 */
const EVENTS_KEY = 'echostress.jobs.events';

function loadEvents(): Record<string, JobEvent[]> {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, JobEvent[]>) : {};
  } catch {
    return {};
  }
}

function saveEvents(events: Record<string, JobEvent[]>): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch {
    // Хранилище переполнено — журнал не настолько важен, чтобы ронять
    // из-за него загрузку. Работаем дальше без записи на диск.
  }
}

export interface SubmitMeta {
  /**
   * Сценарий, под который отправляют запись.
   *
   * Уходит в запрос полем `case_id` — backend по нему выбирает pipeline.
   * Здесь же он нужен, чтобы разложить записи по двум разделам интерфейса.
   */
  case_id: CaseId;
}

/**
 * Событие обработки для журнала над списком.
 *
 * Контракт ленты событий не отдаёт: `GET /v1/calls/{job_id}` возвращает
 * только статус из четырёх значений, ручки `/events` нет, потоковой
 * выдачи тоже. Поэтому журнал складывается из того, что наблюдаемо на
 * клиенте: отправка, приём задания, каждая смена статуса, завершение.
 *
 * Когда на сервисе появится своя лента, менять придётся только источник:
 * достаточно будет дописывать сюда пришедшие события тем же pushEvent,
 * ничего в отображении не трогая.
 */
export interface JobEvent {
  /** Время по часам клиента, мс. Показывается с десятыми долями. */
  at: number;
  text: string;
  /** Конец обработки — на нём останавливается таймер. */
  terminal?: boolean;
}

export interface JobRow extends Job {
  /** Имя исходного файла: сервер его не возвращает, помним локально. */
  filename: string;
  /**
   * Кейс, под который запись отправляли.
   *
   * Помним локально по той же причине, что и имя файла: `GET /v1/calls/
   * {job_id}` кейса не возвращает — он появляется только в результате,
   * а список должен делиться по сценариям сразу, ещё до готовности.
   * null — запись из старого списка, когда выбора кейса не было.
   */
  case_id: CaseId | null;
}

/** Ход отправки: какой файл идёт сейчас и сколько его ушло. */
export interface UploadProgress {
  filename: string;
  /** Номер файла в пачке, с единицы. */
  index: number;
  total: number;
  /** 0..1, либо null — браузер не сообщил объём. */
  fraction: number | null;
}

export function useJobs(caseId: CaseId) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  /**
   * Задания последней отправки — для блока состояния над списком.
   *
   * Держится отдельно от самого списка: блок показывает не «всё, что
   * есть», а «то, что отправили только что». Значение заменяется целиком
   * при каждой новой отправке, поэтому после завершения обработки блок
   * остаётся на месте, а следующая загрузка показывает в нём уже новую
   * запись.
   */
  const [watchIds, setWatchIds] = useState<string[]>(loadWatchIds);

  /** Журнал событий по заданиям. Копится только в памяти вкладки. */
  const [events, setEvents] = useState<Record<string, JobEvent[]>>(loadEvents);

  const pushEvent = useCallback(
    (jobId: string, text: string, at: number = Date.now(), terminal = false) => {
      setEvents((prev) => {
        const list = prev[jobId] ?? [];
        // Одно и то же событие дважды не пишем: опрос может вернуть
        // прежний статус, а строка «обработка началась» нужна одна.
        // После перезагрузки это же условие не даёт записать заново то,
        // что уже стоит в журнале последней строкой.
        if (list.length > 0 && list[list.length - 1].text === text) return prev;
        const next = { ...prev, [jobId]: [...list, { at, text, terminal }] };
        saveEvents(next);
        return next;
      });
    },
    [],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Имена файлов переживают перезагрузку вместе со списком id.
  const namesRef = useRef<Record<string, string>>({});
  // То же для кейса: сервер его в состоянии задания не возвращает.
  const casesRef = useRef<Record<string, CaseId>>({});
  // Последнее известное состояние — чтобы не перезапрашивать завершённые.
  const knownRef = useRef<Record<string, JobRow>>({});

  useEffect(() => {
    try {
      namesRef.current = JSON.parse(localStorage.getItem(JOBS_KEY + '.names') || '{}');
    } catch {
      namesRef.current = {};
    }
    try {
      casesRef.current = JSON.parse(localStorage.getItem(JOBS_KEY + '.cases') || '{}');
    } catch {
      casesRef.current = {};
    }
  }, []);

  const rememberName = useCallback((jobId: string, filename: string) => {
    namesRef.current[jobId] = filename;
    localStorage.setItem(JOBS_KEY + '.names', JSON.stringify(namesRef.current));
  }, []);

  const rememberCase = useCallback((jobId: string, caseId: CaseId) => {
    casesRef.current[jobId] = caseId;
    localStorage.setItem(JOBS_KEY + '.cases', JSON.stringify(casesRef.current));
  }, []);

  /**
   * Подтягивает состояние заданий.
   *
   * Завершённые (done, failed) заново не запрашиваются: их состояние
   * уже не изменится, а при опросе раз в несколько секунд это был бы
   * лишний запрос на каждую строку списка при каждом тике.
   */
  const refresh = useCallback(async (ids?: string[]) => {
    const list = ids ?? loadJobIds();
    if (list.length === 0) {
      knownRef.current = {};
      setJobs([]);
      return [];
    }

    const stale = list.filter((id) => {
      const known = knownRef.current[id];
      return !known || !TERMINAL_STATUSES.includes(known.status);
    });

    const settled = await Promise.allSettled(stale.map((id) => getJob(id)));

    const gone = new Set<string>();
    settled.forEach((r, i) => {
      const id = stale[i];
      if (r.status === 'fulfilled') {
        const before = knownRef.current[id]?.status;
        // Ход обработки: строку пишет сервис, своими словами стадии не
        // пересказываем. Событие добавляется раньше смены статуса —
        // иначе «обработка завершена» встало бы выше последней стадии.
        const progressText = PROGRESS_EVENT_TEXT(r.value);
        if (progressText) pushEvent(id, progressText);
        if (r.value.status !== before) {
          pushEvent(
            id,
            STATUS_EVENT_TEXT(r.value),
            Date.now(),
            TERMINAL_STATUSES.includes(r.value.status),
          );
        }
        knownRef.current[id] = {
          ...r.value,
          filename: namesRef.current[id] ?? r.value.call_id,
          case_id: casesRef.current[id] ?? null,
        };
      } else if (r.reason instanceof ApiError && r.reason.status === 404) {
        // Задания больше нет на сервере — убираем из локального списка.
        gone.add(id);
        delete knownRef.current[id];
      }
      // Прочие отказы (сеть, 502) состояние не трогают: строка
      // останется с прежним статусом и обновится на следующем тике.
    });

    const alive = list.filter((id) => !gone.has(id));
    if (alive.length !== list.length) saveJobIds(alive);

    const rows = alive.map((id) => knownRef.current[id]).filter(Boolean) as JobRow[];
    setJobs(rows);
    return rows;
  }, [pushEvent]);

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось получить состояние'))
      .finally(() => setLoading(false));
  }, [refresh]);

  /**
   * Опрос, пока есть незавершённые задания. Останавливается сам, когда
   * все дошли до done или failed. Интервал растёт: первые тики частые,
   * дальше реже — обработка всё равно занимает минуты.
   */
  /**
   * Ключ незавершённых заданий.
   *
   * Эффект ниже нельзя привязывать к самому jobs: refresh кладёт в состояние
   * новый массив на каждом тике, эффект перезапускался бы, счётчик шагов
   * обнулялся — и опрос навсегда оставался бы на первом, самом частом шаге.
   * Здесь же значение меняется только тогда, когда меняется состав ещё
   * считающихся заданий, то есть по делу.
   */
  const pendingKey = jobs
    .filter((j) => !TERMINAL_STATUSES.includes(j.status))
    .map((j) => j.job_id)
    .join(',');

  useEffect(() => {
    if (pendingKey === '') return;

    let cancelled = false;
    let tick = 0;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = POLL_STEPS_MS[Math.min(tick, POLL_STEPS_MS.length - 1)];
      timer = setTimeout(async () => {
        if (cancelled) return;
        tick += 1;
        try {
          await refresh();
        } catch {
          // Сервис мог моргнуть — опрос не прекращаем.
        }
        if (!cancelled) schedule();
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pendingKey, refresh]);

  /**
   * Загрузка файлов по одному.
   *
   * Пакетная ручка есть, но она задаёт общие значения на всю пачку;
   * при поштучной отправке видно, какой именно файл отвергнут и почему,
   * и можно показывать ход отправки по каждому.
   */
  const upload = useCallback(
    async (files: File[], meta: SubmitMeta) => {
      setUploading(true);
      setError(null);
      const problems: string[] = [];
      const ids = loadJobIds();
      const batch: string[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setProgress({ filename: file.name, index: i + 1, total: files.length, fraction: 0 });
        // Отсечка до запроса: с неё пойдёт таймер, потому что для
        // пользователя обработка начинается в момент отправки.
        const startedAt = Date.now();
        try {
          const job = await submitCall(
            { file, ...meta },
            {
              onProgress: (fraction) =>
                setProgress({ filename: file.name, index: i + 1, total: files.length, fraction }),
            },
          );
          rememberName(job.job_id, file.name);
          rememberCase(job.job_id, meta.case_id);
          pushEvent(job.job_id, `запись отправлена: ${file.name}`, startedAt);
          pushEvent(job.job_id, `задание принято сервисом, job ${job.job_id}`);
          pushEvent(
            job.job_id,
            STATUS_EVENT_TEXT(job),
            Date.now(),
            TERMINAL_STATUSES.includes(job.status),
          );
          if (!batch.includes(job.job_id)) batch.push(job.job_id);
          // Повторная загрузка того же файла возвращает существующее
          // задание — это не ошибка, просто не добавляем дубль в список.
          if (!ids.includes(job.job_id)) ids.push(job.job_id);
          // Состояние могло измениться — заставляем перезапросить.
          delete knownRef.current[job.job_id];
        } catch (e) {
          const msg = e instanceof ApiError || e instanceof Error
            ? e.message
            : 'не удалось загрузить';
          problems.push(`${file.name}: ${msg}`);
        }
      }

      saveJobIds(ids);
      // Блок над списком переключается на новую отправку, но только если
      // хоть что-то принято: при полностью отвергнутой пачке показывать
      // нечего, и прежнее содержимое блока полезнее пустоты.
      if (batch.length > 0) {
        saveWatchIds(batch);
        setWatchIds(batch);
      }
      setProgress(null);
      await refresh(ids);
      setUploading(false);
      if (problems.length > 0) setError(problems.join('; '));
      return problems;
    },
    [refresh, rememberName, rememberCase, pushEvent],
  );

  const forget = useCallback(
    async (jobId: string) => {
      const ids = loadJobIds().filter((id) => id !== jobId);
      saveJobIds(ids);
      delete knownRef.current[jobId];
      setWatchIds((prev) => {
        const next = prev.filter((id) => id !== jobId);
        if (next.length !== prev.length) saveWatchIds(next);
        return next;
      });
      // Журнал удалённой записи больше не нужен и только занимает место.
      setEvents((prev) => {
        if (!(jobId in prev)) return prev;
        const next = { ...prev };
        delete next[jobId];
        saveEvents(next);
        return next;
      });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      await refresh(ids);
    },
    [refresh],
  );

  // --- Выбор строк ---

  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelected(checked ? new Set(jobs.map((j) => j.job_id)) : new Set());
    },
    [jobs],
  );

  // --- Отбор по сценарию и пагинация ---

  /**
   * Список делится по кейсу, но опрос — нет: задания второго сценария
   * продолжают опрашиваться, пока открыт первый, иначе при переключении
   * пришлось бы ждать их состояния заново.
   *
   * Записи без кейса — из списка, который вёлся до появления выбора.
   * Показываем их в любом разделе: пропасть из интерфейса они не должны.
   */
  const inCase = jobs
    .filter((j) => j.case_id === null || j.case_id === caseId)
    // Свежие сверху: список читают с начала, а интересна последняя
    // работа. Разбор по времени отправки, а не по порядку в хранилище.
    .sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at));

  const total = inCase.length;
  /** Готовые — считаем по тому же отбору, что и total, иначе «5 из 2». */
  const doneCount = inCase.filter((j) => j.status === 'done').length;
  const lastPageOffset = total === 0 ? 0 : Math.floor((total - 1) / pageSize) * pageSize;
  const safeOffset = Math.min(Math.max(0, offset), lastPageOffset);
  const visibleJobs = inCase.slice(safeOffset, safeOffset + pageSize);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setOffset(0);
  }, []);

  const selectedCount = selected.size;

  // Порядок — как при отправке, а не как в списке.
  const watched = watchIds
    .map((id) => inCase.find((j) => j.job_id === id))
    .filter((j): j is JobRow => Boolean(j));

  return {
    jobs, visibleJobs, watched, events, loading, error, uploading, progress,
    total, doneCount, offset: safeOffset, pageSize, setOffset, changePageSize,
    selected, selectedCount,
    allSelected: total > 0 && selectedCount === total,
    someSelected: selectedCount > 0 && selectedCount < total,
    toggleOne, toggleAll,
    upload, refresh, forget, setError,
  };
}

/** Статусы стадий, которые в ленту не попадают. */
const SKIPPED = ['SKIPPED_NO_INPUT'];

/**
 * Текст события по ходу обработки.
 *
 * null — сервис ничего нового не сообщил. Счётчик задач показываем как
 * счётчик, а не как проценты: общего числа задач контракт не даёт.
 */
function PROGRESS_EVENT_TEXT(job: Job): string | null {
  const p = job.progress;
  if (!p) return null;
  // Пропущенные стадии в журнал не пишем: SKIPPED_NO_INPUT означает, что
  // для стадии не было входных данных и считать было нечего. Это не ход
  // работы, а её отсутствие — в бегущей ленте такие строки только
  // отвлекают от настоящих стадий.
  if (SKIPPED.includes(p.stage_status ?? '')) return null;
  const head = p.message?.trim() || (p.stage ? `стадия ${p.stage}` : '');
  if (!head) return null;
  const tail: string[] = [];
  if (p.stage && p.message) tail.push(p.stage);
  if (typeof p.completed_tasks === 'number') tail.push(`задач: ${p.completed_tasks}`);
  if (p.stage_status && p.stage_status !== 'OK') tail.push(p.stage_status);
  return tail.length > 0 ? `${head} · ${tail.join(' · ')}` : head;
}

/** Текст события для смены статуса. Причина отказа входит в строку. */
function STATUS_EVENT_TEXT(job: Job): string {
  switch (job.status) {
    case 'queued':
      return 'принято в очередь, обработка ещё не началась';
    case 'running':
      return 'обработка началась';
    case 'done':
      return 'обработка завершена, результат готов';
    case 'failed':
      return `обработка прервана: ${job.error ?? 'причина не указана'}`;
    default:
      return `статус: ${job.status}`;
  }
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  queued: 'В очереди',
  running: 'Обработка',
  done: 'Готово',
  failed: 'Ошибка',
};
