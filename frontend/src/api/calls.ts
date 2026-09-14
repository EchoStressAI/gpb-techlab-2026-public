import { api, ApiError } from './client';
import type { UploadOptions } from './client';
import type {
  AuditResponse,
  Case1Response,
  CaseId,
  BatchResponse,
  CallResult,
  Job,
  RiskResponse,
  SubmitCallInput,
  Employee,
  EmployeeCall,
  EmployeeCallsResponse,
  EmployeesResponse,
  Transcript,
  UploadRecord,
  UploadsResponse,
  WhoAmI,
} from '../types';


/**
 * Имя ресурса заданий: `/jobs` или `/calls`.
 *
 * Сборки сервиса расходятся: интеграционный документ описывает
 * `POST /api/v1/jobs`, прежний контракт — `POST /api/v1/calls`, и по
 * ответу 404 отличить «не та ручка» от «нет такого задания» заранее
 * нельзя. Поэтому имя подбирается один раз по первому удачному запросу
 * и запоминается: дальше лишних попыток нет.
 *
 * Подбор ограничен ровно этими двумя значениями и только кодом 404 —
 * ошибки доступа, сети и валидации пробрасываются сразу, без второй
 * попытки.
 */
type JobsBase = '/jobs' | '/calls';

const BASE_ORDER: JobsBase[] = ['/jobs', '/calls'];
const BASE_KEY = 'echostress.api.jobsBase';

let jobsBase: JobsBase | null = (() => {
  try {
    const saved = localStorage.getItem(BASE_KEY) as JobsBase | null;
    return saved && BASE_ORDER.includes(saved) ? saved : null;
  } catch {
    return null;
  }
})();

function candidates(): JobsBase[] {
  return jobsBase ? [jobsBase] : BASE_ORDER;
}

function rememberBase(base: JobsBase): void {
  jobsBase = base;
  try {
    localStorage.setItem(BASE_KEY, base);
  } catch {
    // Хранилище недоступно — подбор просто повторится в следующий раз.
  }
}

/** Имя ресурса, если оно уже известно. Для сообщений об ошибках. */
export function knownJobsBase(): string | null {
  return jobsBase;
}

/** Выполняет запрос, подбирая имя ресурса при 404. */
async function withBase<T>(run: (base: JobsBase) => Promise<T>): Promise<T> {
  const list = candidates();
  for (let i = 0; i < list.length; i += 1) {
    try {
      const value = await run(list[i]);
      rememberBase(list[i]);
      return value;
    } catch (e) {
      const last = i === list.length - 1;
      if (last || !(e instanceof ApiError) || e.status !== 404) throw e;
    }
  }
  // Недостижимо: список непустой, последняя попытка всегда пробрасывает.
  throw new ApiError(404, 'Ручка заданий не найдена на сервисе');
}

/** Кто я и какие у меня права. Интерфейс строится по этому списку. */
export function whoami(): Promise<WhoAmI> {
  return api.get<WhoAmI>('/whoami');
}

/**
 * Загрузка одной записи.
 *
 * Из формы уходит только файл и сценарий: `case_id` обязателен, по нему
 * backend сам выбирает pipeline (CASE_1 — антифрод, CASE_2 — выгорание).
 * Сотрудник, время разговора и роли каналов больше не вводятся вручную:
 * backend берёт их из имени файла и своего frozen mapping.
 *
 * Повторная отправка того же файла не создаёт второе задание: звонок
 * опознаётся по содержимому, вернётся тот же job_id. Это не ошибка.
 */
export function submitCall(input: SubmitCallInput, opts?: UploadOptions): Promise<Job> {
  // Загрузка идёт через XHR: на 512 МБ нужен показ хода отправки.
  // FormData одноразова не по букве стандарта, а по сути: XHR читает
  // из неё поток, поэтому для второй попытки форма собирается заново.
  return withBase((base) => {
    const body = new FormData();
    body.append('file', input.file);
    body.append('case_id', input.case_id);
    return api.upload<Job>(base, body, opts ?? {});
  });
}

/**
 * Пакетная загрузка. Сценарий общий на всю пачку.
 *
 * Отказ по одной записи не отменяет остальные: смотреть нужно оба
 * списка ответа, accepted и rejected.
 */
export function submitBatch(files: File[], caseId: CaseId): Promise<BatchResponse> {
  return withBase((base) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    form.append('case_id', caseId);
    return api.upload<BatchResponse>(`${base}/batch`, form);
  });
}

/** Доступность сервиса. Без токена и вне префикса /v1. */
export function health(signal?: AbortSignal): Promise<{ status?: string }> {
  return api.health(signal);
}

/** Состояние обработки. Опрашивать можно свободно — в журнал не пишется. */
export function getJob(jobId: string, signal?: AbortSignal): Promise<Job> {
  return withBase((base) => api.get<Job>(`${base}/${jobId}`, signal));
}

/**
 * История загрузок — реальные пользовательские записи с backend.
 *
 * Источник истины именно здесь: localStorage годится только как кэш
 * интерфейса. Ответ нормализуем, потому что сервис отдаёт его и голым
 * списком, и объектом с items/uploads.
 */
export async function getUploads(
  params: { limit?: number; case_id?: string } = {},
  signal?: AbortSignal,
): Promise<UploadRecord[]> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.case_id) query.set('case_id', params.case_id);
  const qs = query.toString();
  const raw = await api.get<UploadsResponse | UploadRecord[]>(
    `/uploads${qs ? `?${qs}` : ''}`,
    signal,
  );
  if (Array.isArray(raw)) return raw;
  return raw.items ?? raw.uploads ?? raw.calls ?? [];
}

/** Технический результат: что посчитано, на каком материале и с каким качеством. */
export function getResult(jobId: string, signal?: AbortSignal): Promise<CallResult> {
  return withBase((base) => api.get<CallResult>(`${base}/${jobId}/result`, signal));
}

/** Расшифровка. Требует отдельного права transcript:read. */
export function getTranscript(jobId: string, signal?: AbortSignal): Promise<Transcript> {
  return withBase((base) => api.get<Transcript>(`${base}/${jobId}/transcript`, signal));
}

/**
 * Оценка риска. Требует risk:read, а пока модель внутренняя —
 * дополнительно risk:read_internal. Каждый показ пишется в журнал.
 */
export function getRisk(jobId: string, signal?: AbortSignal): Promise<RiskResponse> {
  return withBase((base) => api.get<RiskResponse>(`${base}/${jobId}/risk`, signal));
}

/**
 * Экран кейса 1 целиком: воздействие, состояние клиента, достаточность
 * сведений и следующий вопрос. Требует права risk:read.
 */
export function getCase1(jobId: string, signal?: AbortSignal): Promise<Case1Response> {
  return withBase((base) => api.get<Case1Response>(`${base}/${jobId}/case1`, signal));
}

/** Журнал обращений. Чтение журнала тоже записывается в журнал. */
export function getAudit(params: {
  limit?: number;
  call_id?: string;
  operator_id?: string;
} = {}): Promise<AuditResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.call_id) query.set('call_id', params.call_id);
  if (params.operator_id) query.set('operator_id', params.operator_id);
  const qs = query.toString();
  return api.get<AuditResponse>(`/audit${qs ? `?${qs}` : ''}`);
}

// ---------- Кейс 2: личная история ----------

/** Сотрудники, по которым сервис ведёт историю. */
export async function getEmployees(signal?: AbortSignal): Promise<Employee[]> {
  const raw = await api.get<EmployeesResponse | Employee[]>('/employees', signal);
  if (Array.isArray(raw)) return raw;
  return raw.employees ?? raw.items ?? [];
}

/**
 * История звонков сотрудника.
 *
 * `asOf` задаёт точку во времени: сервис не отдаёт звонки позже неё.
 * Это защита от утечки будущего при разборе конкретного разговора —
 * показывать записи, которых на тот момент ещё не было, нельзя.
 */
export async function getEmployeeCalls(
  employeeId: string,
  asOf?: string,
  signal?: AbortSignal,
): Promise<EmployeeCall[]> {
  const qs = asOf ? `?as_of=${encodeURIComponent(asOf)}` : '';
  const raw = await api.get<EmployeeCallsResponse | EmployeeCall[]>(
    `/employees/${encodeURIComponent(employeeId)}/calls${qs}`,
    signal,
  );
  if (Array.isArray(raw)) return raw;
  return raw.calls ?? raw.items ?? [];
}
