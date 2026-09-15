/**
 * Public frontend contract.
 *
 * Этот файл намеренно описывает только поля, которые нужны публичному UI.
 * Internal feature vectors, thresholds, imputation details, exact XAI
 * contributions, research-only state dimensions and proprietary schema are not
 * part of the public source contract.
 */

// ---------- Authentication / scopes ----------

export type Scope =
  | 'calls:submit'
  | 'calls:read'
  | 'transcript:read'
  | 'risk:read'
  | 'audit:read';

export interface WhoAmI {
  subject_id: string;
  scopes: Scope[];
}

// ---------- Cases ----------

export type CaseId = 'CASE_1' | 'CASE_2';

export interface CaseInfo {
  id: CaseId;
  title: string;
  kicker: string;
  description: string;
}

export const CASES: CaseInfo[] = [
  {
    id: 'CASE_1',
    title: 'Воздействие мошенников',
    kicker: 'Сценарий 1 · CASE_1',
    description: 'Окно анализа 0–60 сек. Каждая запись оценивается отдельно.',
  },
  {
    id: 'CASE_2',
    title: 'Риск профессионального выгорания',
    kicker: 'Сценарий 2 · CASE_2',
    description: 'Окно анализа 0–180 сек. Для повторных наблюдений доступна история сотрудника.',
  },
];

export function caseInfo(id: CaseId): CaseInfo {
  return CASES.find((c) => c.id === id) ?? CASES[0];
}

// ---------- Jobs / uploads ----------

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';
export const TERMINAL_STATUSES: JobStatus[] = ['done', 'failed'];

export interface JobProgress {
  state?: string | null;
  case_id?: CaseId | string | null;
  stage?: string | null;
  message?: string | null;
  completed_tasks?: number | null;
  stage_status?: string | null;
}

export interface Job {
  job_id: string;
  call_id: string;
  operator_id: string;
  status: JobStatus;
  submitted_by: string;
  submitted_at: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  case_id?: CaseId | string | null;
  progress?: JobProgress | null;
}

export interface UploadRecord {
  job_id?: string | null;
  call_id?: string | null;
  filename?: string | null;
  case_id?: CaseId | string | null;
  status?: JobStatus | string | null;
  operator_id?: string | null;
  employee_id?: string | null;
  call_datetime?: string | null;
  uploaded_at?: string | null;
  submitted_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  submitted_by?: string | null;
  error?: string | null;
}

export interface UploadsResponse {
  calls?: UploadRecord[];
  items?: UploadRecord[];
  uploads?: UploadRecord[];
  total?: number;
  returned?: number;
}

export interface SubmitCallInput {
  file: File;
  case_id: CaseId;
}

export interface BatchAccepted {
  filename: string;
  job_id: string;
  status: JobStatus;
}

export interface BatchRejected {
  filename: string;
  detail: string;
}

export interface BatchResponse {
  accepted: BatchAccepted[];
  rejected: BatchRejected[];
}

// ---------- Transcript ----------

export type SpeakerRole = 'CALLER' | 'SUPPORT_OPERATOR';

export interface TranscriptTurn {
  dialogue_turn_index: number;
  reply_id: string;
  speaker_role: SpeakerRole;
  channel_index: number;
  start_sec: number;
  end_sec: number;
  speech_sec: number;
  text: string | null;
  asr_status: string;
  semantic_text_observable: boolean;
  gap_from_previous_sec: number | null;
  overlaps_previous: boolean;
}

export interface Transcript {
  job_id: string;
  call_id: string;
  operator_id: string;
  turns: TranscriptTurn[];
}

// ---------- CASE 2 public-safe primary ----------

export interface Case2Primary {
  status: string;
  product_role?: string | null;
  model_id?: string | null;
  validated_unit?: string | null;
  risk_score?: number | null;
  score_is_probability?: boolean | null;
  reference_percentile?: number | null;
  risk_band?: string | null;
  note?: string | null;
  reason?: string | null;
}

export interface RiskResponse {
  primary?: Case2Primary | null;
  job_id: string;
  call_id: string;
  operator_id: string;
  reason?: string | null;
}

// ---------- CASE 1 public-safe primary ----------

export interface Case1Primary {
  status: string;
  model_id?: string | null;
  product_role?: string | null;
  primary_score?: number | null;
  score_is_probability?: boolean | null;
  decision_status?: string | null;
  evidence_status?: string | null;
  reason?: string | null;
  note?: string | null;
}

export interface Case1Response {
  primary?: Case1Primary | null;
  job_id: string;
  call_id: string;
  operator_id: string;
  case_id: string;
}

export const CASE1_DECISION_LABEL: Record<string, string> = {
  INSUFFICIENT_EVIDENCE: 'Недостаточно данных для оценки',
  NOT_INFLUENCED_HIGH_CONFIDENCE: 'Признаков воздействия не выявлено',
  REVIEW_REQUIRED: 'Требуется проверка оператором',
  POSSIBLE_INFLUENCE: 'Возможно внешнее воздействие',
};

// ---------- Audit ----------

export type AuditAction =
  | 'submit_call'
  | 'read_result'
  | 'read_transcript'
  | 'read_risk'
  | 'read_audit'
  | 'denied';

export interface AuditRecord {
  at: string;
  subject_id: string;
  action: AuditAction;
  call_id: string | null;
  operator_id: string | null;
  granted: boolean;
  scope: string;
  detail: string | null;
}

export interface AuditResponse {
  total: number;
  returned: number;
  records: AuditRecord[];
}

// ---------- CASE 2 employee history ----------

export interface Employee {
  employee_id: string;
  calls_count?: number | null;
  n_calls?: number | null;
  label?: string | null;
  label_status?: string | null;
  role?: string | null;
}

export interface EmployeeCall {
  call_id?: string | null;
  job_id?: string | null;
  call_datetime?: string | null;
  risk_score?: number | null;
  risk_band?: string | null;
  [key: string]: unknown;
}

export interface EmployeesResponse {
  employees?: Employee[];
  items?: Employee[];
  total?: number;
}

export interface EmployeeCallsResponse {
  employee_id?: string;
  calls?: EmployeeCall[];
  items?: EmployeeCall[];
  total?: number;
}
