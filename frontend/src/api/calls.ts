import { api, ApiError } from './client';
import type { UploadOptions } from './client';
import type {
  AuditResponse,
  BatchResponse,
  Case1Response,
  CaseId,
  Employee,
  EmployeeCall,
  EmployeeCallsResponse,
  EmployeesResponse,
  Job,
  RiskResponse,
  SubmitCallInput,
  Transcript,
  UploadRecord,
  UploadsResponse,
  WhoAmI,
} from '../types';

/** Public frontend supports the two deployed job resource names. */
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
    // Storage is optional; endpoint discovery can repeat next session.
  }
}

export function knownJobsBase(): string | null {
  return jobsBase;
}

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
  throw new ApiError(404, 'Ручка заданий не найдена на сервисе');
}

export function whoami(): Promise<WhoAmI> {
  return api.get<WhoAmI>('/whoami');
}

export function submitCall(input: SubmitCallInput, opts?: UploadOptions): Promise<Job> {
  return withBase((base) => {
    const body = new FormData();
    body.append('file', input.file);
    body.append('case_id', input.case_id);
    return api.upload<Job>(base, body, opts ?? {});
  });
}

export function submitBatch(files: File[], caseId: CaseId): Promise<BatchResponse> {
  return withBase((base) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    form.append('case_id', caseId);
    return api.upload<BatchResponse>(`${base}/batch`, form);
  });
}

export function health(signal?: AbortSignal): Promise<{ status?: string }> {
  return api.health(signal);
}

export function getJob(jobId: string, signal?: AbortSignal): Promise<Job> {
  return withBase((base) => api.get<Job>(`${base}/${jobId}`, signal));
}

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

export function getTranscript(jobId: string, signal?: AbortSignal): Promise<Transcript> {
  return withBase((base) => api.get<Transcript>(`${base}/${jobId}/transcript`, signal));
}

/** Public-safe CASE 2 projection. */
export function getRisk(jobId: string, signal?: AbortSignal): Promise<RiskResponse> {
  return withBase((base) => api.get<RiskResponse>(`${base}/${jobId}/risk`, signal));
}

/** Public-safe CASE 1 projection. */
export function getCase1(jobId: string, signal?: AbortSignal): Promise<Case1Response> {
  return withBase((base) => api.get<Case1Response>(`${base}/${jobId}/case1`, signal));
}

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

export async function getEmployees(signal?: AbortSignal): Promise<Employee[]> {
  const raw = await api.get<EmployeesResponse | Employee[]>('/employees', signal);
  if (Array.isArray(raw)) return raw;
  return raw.employees ?? raw.items ?? [];
}

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
