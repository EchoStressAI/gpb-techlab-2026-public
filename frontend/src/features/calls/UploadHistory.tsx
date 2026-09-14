import { useCallback, useEffect, useMemo, useState } from 'react';
import { color, radius, shadow } from '../../theme';
import { StatusBadge } from '../../components/ui';
import { dateTime } from '../../utils/format';
import { getUploads } from '../../api/calls';
import { ApiError } from '../../api/client';
import { caseInfo } from '../../types';
import type { CaseId, JobStatus, UploadRecord } from '../../types';
import { PAGE_SIZE_OPTIONS, type JobRow } from './useJobs';
import { useVerdicts, type Verdict } from './useVerdicts';

/**
 * Список записей — единственный на странице.
 *
 * Источник истины один: `GET /v1/uploads`. Локальный перечень заданий
 * из браузера больше не показывается — он расходился с сервером по
 * составу и количеству, и два списка об одном и том же читались как
 * повторная обработка.
 */
export function UploadHistory({
  reloadKey, caseId, onOpen,
}: {
  reloadKey: number;
  caseId: CaseId;
  onOpen: (job: JobRow) => void;
}) {
  const [rows, setRows] = useState<UploadRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [offset, setOffset] = useState(0);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    return getUploads({ limit: 500 }, signal)
      .then((list) => {
        setRows(list);
        setError(null);
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(
          e instanceof ApiError && e.status === 404
            ? 'Сервис не отдаёт список записей'
            : e instanceof Error ? e.message : 'Не удалось получить список',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load, reloadKey]);

  // Список делится по сценарию: смешивать антифрод и выгорание нельзя —
  // это разные модели и разные выводы. Записи без кейса видны в обоих
  // разделах, чтобы не исчезли из интерфейса.
  const shown = useMemo(() => (
    (rows ?? [])
      .filter((r) => !r.case_id || r.case_id === caseId)
      // Свежие сверху.
      .sort((a, b) => uploadTime(b) - uploadTime(a))
  ), [rows, caseId]);

  const total = shown.length;
  const doneCount = shown.filter((r) => r.status === 'done').length;

  // Смещение не должно пережить смену сценария или сжатие списка:
  // иначе открывается пустая страница без объяснения.
  const safeOffset = offset >= total ? 0 : offset;
  useEffect(() => setOffset(0), [caseId]);

  const page = shown.slice(safeOffset, safeOffset + pageSize);

  return (
    <div style={{
      background: color.card, borderRadius: radius.card,
      boxShadow: shadow.card, overflow: 'hidden', marginTop: 16,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          {/* Сначала сценарий, потом сам список: заголовок отвечает на
              вопрос «про что таблица», а не «как она называется». */}
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {caseInfo(caseId).title}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.75, marginTop: 2 }}>
            Записи{total > 0 ? ` — ${total}` : ''}
          </div>
          <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>
            Данные сервиса. Записи демонстрационного корпуса сюда не входят.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14 }}>
          {total > 0 && (
            <span style={{ opacity: 0.7 }}>Готово {doneCount} из {total}</span>
          )}
          <span
            onClick={loading ? undefined : () => load()}
            style={{
              fontWeight: 600, cursor: loading ? 'default' : 'pointer',
              color: loading ? color.inkMuted : color.orange,
            }}
          >
            {loading ? 'Обновление…' : 'Обновить'}
          </span>
        </div>
      </div>

      {error ? (
        <Note>{error}</Note>
      ) : loading && rows === null ? (
        <Note>Загрузка списка…</Note>
      ) : total === 0 ? (
        <Note>По этому сценарию сервис не знает ни одной записи</Note>
      ) : (
        <>
          <Table
            rows={page} total={total} offset={safeOffset}
            caseId={caseId} onOpen={onOpen}
          />
          <Pagination
            total={total} offset={safeOffset} pageSize={pageSize}
            setOffset={setOffset}
            changePageSize={(n) => { setPageSize(n); setOffset(0); }}
          />
        </>
      )}
    </div>
  );
}

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const COLS = '44px 1.9fr 1.1fr 110px 90px 1.2fr 104px';

/**
 * Выравнивание колонок — одно на всю таблицу.
 *
 * Всё по левому краю, включая числа: так столбец читается сверху вниз
 * одной вертикалью, а подпись стоит ровно над значением. Числа набраны
 * моноширинными цифрами, поэтому разряды всё равно не пляшут.
 */
const ALIGN: React.CSSProperties['textAlign'] = 'left';

function Table({
  rows, total, offset, caseId, onOpen,
}: {
  rows: UploadRecord[];
  total: number;
  offset: number;
  caseId: CaseId;
  onOpen: (job: JobRow) => void;
}) {
  // Итоги догружаются только по видимой странице.
  const jobs = useMemo(() => rows.map((r) => toJobRow(r, caseId)), [rows, caseId]);
  const verdicts = useVerdicts(jobs, caseId);

  return (
    <>
      <div style={{
        display: 'grid', gridTemplateColumns: COLS, gap: 16, padding: '10px 24px',
        fontSize: 13, fontWeight: 700, opacity: 0.6, alignItems: 'end',
        borderTop: `1px solid ${color.border}80`,
      }}>
        {/* «ID записи», а не «Файл»: сервис не возвращает имени файла, в
            колонке стоит call_id — подпись должна называть то, что там
            на самом деле. */}
        {['№', 'ID записи', 'Загружено', 'Статус', 'Прогноз', 'Достаточность', 'Действие']
          .map((label) => (
            <div key={label} style={{ textAlign: ALIGN }}>{label}</div>
          ))}
      </div>

      {rows.map((r, i) => {
        const job = jobs[i];
        return (
          <div
            key={job.job_id || i}
            style={{
              display: 'grid', gridTemplateColumns: COLS, gap: 16,
              alignItems: 'center', padding: '10px 24px', fontSize: 14,
              borderTop: `1px solid ${color.border}60`,
            }}
          >
            {/* Нумерация убывает сверху вниз и продолжается на второй
                странице: номер строки не меняется от новых записей. */}
            <div style={{
              opacity: 0.5, fontVariantNumeric: 'tabular-nums', textAlign: ALIGN,
            }}>
              {total - offset - i}
            </div>

            <div style={{
              fontWeight: 600, wordBreak: 'break-word', textAlign: ALIGN,
            }}>
              {job.filename}
            </div>

            {/*
              Время загрузки. Временем разговора оно не является и так не
              подписано: для банковской выгрузки разговор состоялся
              задолго до отправки файла.
            */}
            <div style={{ fontSize: 13, opacity: 0.75, textAlign: ALIGN }}>
              {uploadTime(r) ? dateTime(new Date(uploadTime(r)).toISOString()) : '—'}
            </div>

            <div style={{ textAlign: ALIGN }}>
              <StatusBadge status={job.status} />
            </div>

            <VerdictCell v={verdicts[job.job_id]} status={job.status} />
            <ScoreCell v={verdicts[job.job_id]} status={job.status} />

            <div style={{ textAlign: ALIGN }}>
              <button
                type="button"
                onClick={() => onOpen(job)}
                disabled={!job.job_id}
                style={{
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                  color: '#FFFFFF', background: job.job_id ? color.orange : color.inkMuted,
                  border: 'none', borderRadius: radius.control,
                  padding: '7px 16px', cursor: job.job_id ? 'pointer' : 'default',
                }}
              >
                Открыть
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}

/**
 * Запись истории в вид, который понимает экран разбора.
 *
 * Имени файла сервис не возвращает — подставляем call_id, иначе строка
 * осталась бы без опознавательного знака. Кейс берём из записи, а при
 * его отсутствии — из выбранного сценария: в чужой раздел запись всё
 * равно не попадает.
 */
function toJobRow(r: UploadRecord, caseId: CaseId): JobRow {
  const fallbackCase = r.case_id === 'CASE_1' || r.case_id === 'CASE_2'
    ? r.case_id
    : caseId;

  return {
    job_id: r.job_id ?? '',
    call_id: r.call_id ?? '',
    operator_id: r.operator_id ?? r.employee_id ?? '—',
    status: (r.status as JobStatus) ?? 'queued',
    submitted_by: r.submitted_by ?? '—',
    submitted_at: r.submitted_at ?? r.uploaded_at ?? '',
    started_at: null,
    finished_at: null,
    // Заметку сервиса о своём реестре ошибкой не считаем: она приходит
    // и у завершённых записей.
    error: r.status === 'failed' ? (r.error ?? null) : null,
    filename: r.filename ?? r.call_id ?? r.job_id ?? '—',
    case_id: fallbackCase,
  };
}

/**
 * Прогноз модели. Пока запись не готова, колонка молчит: писать «нет
 * данных» там, где расчёт ещё идёт, — вводить в заблуждение.
 */
function VerdictCell({ v, status }: { v: Verdict | null | undefined; status: string }) {
  if (status !== 'done') return <Dim>—</Dim>;
  if (v === undefined) return <Dim>загрузка…</Dim>;
  if (v === null) return <Dim>не получено</Dim>;
  if (v.unavailable) return <Dim>{v.unavailable}</Dim>;
  if (v.score === null) return <Dim>—</Dim>;
  // В таблице показывается само значение: строка должна читаться
  // взглядом, а словесный вердикт занимал три слова и переносился.
  // Полностью он остаётся на экране разбора.
  return (
    <div style={{
      fontSize: 17, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
      textAlign: ALIGN,
      color: v.abstain ? color.inkMuted : scoreTone(v.score),
    }}>
      {v.score.toFixed(2)}
    </div>
  );
}

/**
 * Числовая величина модели. Вероятностью она не является, поэтому
 * подписана ранговым индексом, а не процентом. Когда вывод не выносится,
 * число приглушено — оно служебное.
 */
function ScoreCell({ v, status }: { v: Verdict | null | undefined; status: string }) {
  if (status !== 'done' || !v) return <Dim>—</Dim>;
  // Рядом с числом — то, насколько модели хватило данных. Без этого
  // отказ от оценки не отличить от посчитанного низкого ранга.
  return (
    <div style={{
      fontSize: 12, fontFamily: MONO, lineHeight: 1.4, textAlign: ALIGN,
      color: v.abstain ? color.red : color.inkMuted,
    }}>
      {v.code}
    </div>
  );
}

function Pagination({
  total, offset, pageSize, setOffset, changePageSize,
}: {
  total: number;
  offset: number;
  pageSize: number;
  setOffset: (n: number) => void;
  changePageSize: (n: number) => void;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageSize, total);
  const page = Math.floor(offset / pageSize) + 1;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '12px 24px', borderTop: `1px solid ${color.border}80`,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        <span style={{ opacity: 0.7 }}>Строк на странице</span>
        <select
          value={pageSize}
          onChange={(e) => changePageSize(Number(e.target.value))}
          style={{
            fontFamily: 'inherit', fontSize: 14, color: color.ink, padding: '5px 8px',
            borderRadius: radius.control, border: `1px solid ${color.border}`,
            background: '#FFFFFF', cursor: 'pointer',
          }}
        >
          {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
        <span style={{ opacity: 0.7 }}>{from}–{to} из {total}</span>
        <PageButton
          enabled={offset > 0}
          onClick={() => setOffset(Math.max(0, offset - pageSize))}
          label="←"
        />
        <span style={{ opacity: 0.7, minWidth: 60, textAlign: 'center' }}>
          {page} / {pages}
        </span>
        <PageButton
          enabled={offset + pageSize < total}
          onClick={() => setOffset(offset + pageSize)}
          label="→"
        />
      </div>
    </div>
  );
}

function PageButton({
  enabled, onClick, label,
}: { enabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      style={{
        fontFamily: 'inherit', fontSize: 14, padding: '5px 12px',
        borderRadius: radius.control, border: `1px solid ${color.border}`,
        background: '#FFFFFF', color: enabled ? color.ink : color.inkMuted,
        cursor: enabled ? 'pointer' : 'default',
      }}
    >
      {label}
    </button>
  );
}

/**
 * Цвет ранговой величины: пороги 0.33 и 0.66, заданные владельцем
 * продукта. Те же значения действуют на экране разбора.
 *
 * Светофор раскрашивает только само число: оно ранговое, и зелёный
 * здесь означает «низко в ряду», а не «безопасно». Когда оценка не
 * выносится, цвет не применяется вовсе — красить отказ нельзя.
 */
function scoreTone(score: number | null): string {
  if (score === null) return color.ink;
  if (score >= 0.66) return color.red;
  if (score >= 0.33) return color.amber;
  return color.green;
}

/** Время загрузки для сортировки: приём задания, иначе отметка загрузки. */
function uploadTime(r: UploadRecord): number {
  const raw = r.uploaded_at ?? r.submitted_at;
  const t = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(t) ? t : 0;
}

/** Прочерк на месте значения. Выравнивается как само значение. */
function Dim({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, opacity: 0.5, textAlign: ALIGN }}>
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '28px 24px', textAlign: 'center', fontSize: 15,
      borderTop: `1px solid ${color.border}80`, opacity: 0.75,
    }}>
      {children}
    </div>
  );
}
