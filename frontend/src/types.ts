/**
 * Типы по контракту API (префикс /v1, кейс CASE_2).
 *
 * Правило по всему файлу: null означает «не измерено», а не ноль.
 * Поэтому у числовых полей тип `number | null`, и подставлять 0
 * вместо null нельзя — по этим числам принимают решения о людях.
 */

// ---------- Аутентификация и права ----------

export type Scope =
  | 'calls:submit'
  | 'calls:read'
  | 'transcript:read'
  | 'risk:read'
  | 'risk:read_internal'
  | 'audit:read';

export interface WhoAmI {
  subject_id: string;
  scopes: Scope[];
}

// ---------- Сценарии ----------

/**
 * Два сценария сервиса. Кейс задаёт не только название раздела: у них
 * разные окна анализа, разные модели и разные экраны результата.
 */
export type CaseId = 'CASE_1' | 'CASE_2';

export interface CaseInfo {
  id: CaseId;
  title: string;
  /** Короткая подпись над заголовком. */
  kicker: string;
  description: string;
}

export const CASES: CaseInfo[] = [
  {
    id: 'CASE_1',
    title: 'Воздействие мошенников',
    kicker: 'Сценарий 1 · CASE_1',
    description:
      'Окно анализа 0–60 сек. Каждая запись оценивается отдельно, история не строится.',
  },
  {
    id: 'CASE_2',
    title: 'Риск профессионального выгорания',
    kicker: 'Сценарий 2 · CASE_2',
    description:
      'Окно анализа 0–180 сек. По одному operator_id накапливается личная история.',
  },
];

export function caseInfo(id: CaseId): CaseInfo {
  return CASES.find((c) => c.id === id) ?? CASES[0];
}

// ---------- Задание ----------

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

/** Терминальные статусы: опрос прекращается. */
export const TERMINAL_STATUSES: JobStatus[] = ['done', 'failed'];

/**
 * Ход обработки.
 *
 * Обновляется только по реально завершённым задачам pipeline. Отсюда
 * же берётся текст для журнала: `message` пишет backend, своими словами
 * стадии не пересказываем.
 *
 * Ни одно поле не обязательно: старый ответ приходит без `progress`
 * вовсе, а часть полей появляется только на отдельных стадиях.
 */
export interface JobProgress {
  state?: string | null;
  case_id?: CaseId | string | null;
  /** Машинное имя стадии: acoustics, asr, scoring… */
  stage?: string | null;
  /** Готовый текст для показа. */
  message?: string | null;
  /** Счётчик завершённых задач. Не проценты: общего числа контракт не даёт. */
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
  /** Сценарий, если сервис его вернул. */
  case_id?: CaseId | string | null;
  /** Ход обработки. Отсутствует, пока задание в очереди. */
  progress?: JobProgress | null;
}

// ---------- История загрузок ----------

/**
 * Запись из `GET /v1/uploads` — реальные пользовательские загрузки.
 * Frozen demo-корпус сюда не входит.
 *
 * Источник истины — backend. Поля помечены необязательными намеренно:
 * список отдаётся разными сборками сервиса, и отсутствие поля не должно
 * ронять таблицу.
 */
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

/** Ответ приходит и списком, и объектом с полем items/uploads. */
export interface UploadsResponse {
  /** Боевой сервис отдаёт список под ключом `calls`. */
  calls?: UploadRecord[];
  items?: UploadRecord[];
  uploads?: UploadRecord[];
  total?: number;
  returned?: number;
}

// ---------- Загрузка ----------

export type SpeakerRole = 'CALLER' | 'SUPPORT_OPERATOR';

/** Соответствие индексов каналов ролям: {"0": "CALLER", "1": "SUPPORT_OPERATOR"} */
export type ChannelRoles = Record<string, SpeakerRole>;

export interface SubmitCallInput {
  file: File;
  /**
   * Сценарий. Обязательное поле запроса: один backend обслуживает оба
   * кейса и маршрутизирует расчёт по нему.
   */
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

// ---------- Технический результат ----------

export type QcStatus = 'OK' | 'REVIEW_LOW_SPEECH';

export interface AudioInfo {
  duration_sec: number | null;
  channels: number | null;
  sample_rate_hz: number | null;
}

export interface VadInfo {
  method: string;
  qc_status: QcStatus;
}

export interface StageInfo {
  stage: string;
  scope: string;
  count: number;
  statuses: string[];
  /** Объяснение причины словами — годится для показа. */
  note: string | null;
}

/** Окна анализа от начала звонка. Набор замороженный. */
export type WindowKey = '0_60' | '0_120' | '0_180' | 'full';

export const WINDOW_KEYS: WindowKey[] = ['0_60', '0_120', '0_180', 'full'];
/** Основное окно для CASE_2. */
export const PRIMARY_WINDOW: WindowKey = '0_180';

export interface CallResult {
  job_id: string;
  call_id: string;
  operator_id: string;
  case_id: string;
  call_datetime: string;

  audio: AudioInfo;
  vad: VadInfo;
  replies: Partial<Record<SpeakerRole, number>>;
  chunks: number | null;

  windows: Partial<Record<WindowKey, Record<string, unknown>>>;
  /** 176 плоских полей. Выводить выборочно по именам, не целиком. */
  features: Record<string, number | null>;
  /** 102 плоских поля. */
  longitudinal: Record<string, number | null>;

  stages: StageInfo[];
  computed_stages: string[];
  /** Нет модели или артефакта — честный пробел, не сбой. */
  stubbed_stages: string[];
  /** Нечего было считать. */
  skipped_stages: string[];
  elapsed_sec: number | null;
}

// ---------- Расшифровка ----------

export type AsrStatus =
  | 'OK'
  | 'EMPTY_ASR_WITH_SPEECH'
  | 'ASR_ERROR'
  | 'SKIPPED_NOT_ROUTED';

export interface TranscriptTurn {
  dialogue_turn_index: number;
  reply_id: string;
  speaker_role: SpeakerRole;
  channel_index: number;
  start_sec: number;
  end_sec: number;
  speech_sec: number;
  text: string | null;
  asr_status: AsrStatus;
  /**
   * Единственное поле, по которому решают, можно ли строить на тексте
   * выводы. true только при OK и непустом тексте.
   */
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

// ---------- Оценка риска ----------

export interface RiskProvenance {
  aggregation_window_end_sec: number | null;
  n_replies_used: number | null;
  /** Вклады линейной модели — не причины состояния. */
  explanation_type: string;
}

/**
 * Статус оценки. Список открытый — сервис вправе добавить новый,
 * поэтому тип строковый, а не объединение литералов.
 *
 * INSUFFICIENT_PRIMARY_EVIDENCE наступает по двум разным причинам,
 * и различить их можно только по полю note. Поэтому при этом статусе
 * note показывается всегда, а не прячется в подробности.
 */
export type RiskStatus = 'OK' | 'INSUFFICIENT_PRIMARY_EVIDENCE' | (string & {});

export interface RiskAssessment {
  status: RiskStatus;
  model_version: string;

  /**
   * Главное поле оценки.
   *
   * Отвечает не «какая оценка», а «можно ли по ней делать вывод».
   * Читается раньше risk_score: при false число существует, но
   * выводом не является, и показывать его как оценку нельзя.
   *
   * Допускает отсутствие: старые ответы поля не содержат. Всё, что
   * не равно true, трактуется как «вывод делать нельзя» — молчание
   * здесь безопаснее догадки.
   */
  usable_prediction?: boolean | null;

  /** 0..1. Не проценты: читается только вместе с threshold. */
  risk_score: number | null;
  predicted_class: number | null;
  threshold: number | null;
  /** false — число нельзя называть вероятностью. */
  probability_calibrated: boolean;
  /** Пометка о применимости, НЕ о доступе. */
  internal_only: boolean;
  /** Можно ли показывать внешнему зрителю. */
  customer_visible: boolean;
  /** Текст предупреждения. null — предупреждения нет. */
  banner: string | null;
  /** Признаки, подставленные медианой. */
  imputed_features: string[];
  note: string | null;
  provenance: RiskProvenance;
}

/**
 * Вклад признака в оценку. Форму сервис может отдать и объектом, и
 * парой [имя, значение], поэтому разбираем оба варианта.
 */
export type XaiContribution =
  | { feature?: string | null; name?: string | null; value?: number | null; contribution?: number | null }
  | [string, number];

export interface Case2Xai {
  type?: string | null;
  top_positive?: XaiContribution[] | null;
  top_negative?: XaiContribution[] | null;
  abs_error?: number | null;
}

/**
 * PRIMARY-слой кейса 2 — основной результат вкладки оценки.
 *
 * `risk_score` — относительный ранговый индекс модели, а не вероятность
 * выгорания: `score_is_probability` приходит false, и подписывать число
 * процентом нельзя. Проверенная единица наблюдения — период работы
 * сотрудника, а не отдельный звонок.
 */
export interface Case2Primary {
  status: string;
  product_role?: string | null;
  model_id?: string | null;
  validated_unit?: string | null;
  risk_score?: number | null;
  score_is_probability?: boolean | null;
  reference_percentile?: number | null;
  /** Словесная полоса, заданная сервисом. Своими словами не переписываем. */
  risk_band?: string | null;
  xai?: Case2Xai | null;
  note?: string | null;
  reason?: string | null;
}

export interface RiskResponse {
  /** Основной слой. Именно он показывается как оценка кейса 2. */
  primary?: Case2Primary | null;
  /** Исследовательский слой. Основным результатом не является. */
  legacy?: Record<string, unknown> | null;
  job_id: string;
  call_id: string;
  operator_id: string;
  /** null, если модель не подключена — тогда заполнен reason. */
  risk: RiskAssessment | null;
  reason?: string;
}

/**
 * Можно ли вообще читать это число как оценку.
 *
 * Сознательно строгая проверка: undefined и null дают false. Если поле
 * не пришло, мы не знаем, годится ли оценка, — и тогда показываем не
 * число, а причину его отсутствия.
 */
export function isUsable(risk: RiskAssessment): boolean {
  return risk.usable_prediction === true;
}

export const RISK_STATUS_LABEL: Record<string, string> = {
  OK: 'Оценка получена',
  INSUFFICIENT_PRIMARY_EVIDENCE: 'Недостаточно первичных данных',
  MODEL_NOT_AVAILABLE: 'Модель не подключена',
};

// ---------- Кейс 1: экран целиком ----------

/**
 * Четыре слоя считаны независимо и отдаются вместе, потому что вместе и
 * показываются. Карточка состояния и достаточность сведений в оценку
 * воздействия НЕ входят и подавать их как её обоснование нельзя.
 *
 * Слой, который не считался, приезжает как null целиком — не объектом с
 * нулями. Отсюда `| null` у каждого из четырёх.
 */

export type InfluenceStatus = 'OK' | 'ABSTAIN' | (string & {});

export interface InfluenceProvenance {
  window: string;
  cutoff_sec: number | null;
  op60_role: string | null;
  operator_replies_used: number | null;
  operator_replies_total: number | null;
  op60_text_chars: number | null;
  /**
   * Подпись величины, заданную владельцем продукта. Своими словами
   * число не подписываем: именно так появляется слово «вероятность».
   */
  display_label: string | null;
}

export interface Influence {
  /** ABSTAIN — полноправный ответ. Ни нуля, ни «низкого риска» вместо него. */
  status: InfluenceStatus;
  /** Почему входа не хватило. */
  input_status: string | null;
  operational_action: string | null;
  /** Не вероятность, пока probability_calibrated === false. */
  p_under_influence: number | null;
  /** Шкала 0–100 для показа. Рядом обязана стоять оговорка о калибровке. */
  risk_score_0_100: number | null;
  operator_replies_used: number | null;
  operator_replies_total: number | null;
  model_version: string | null;
  probability_calibrated: boolean;
  note: string | null;
  provenance: InfluenceProvenance | null;
}

export type Reliability = 'HIGH' | 'MEDIUM' | 'LOW' | (string & {});

/** Восемь измерений карточки состояния. Набор задан контрактом. */
export const CLIENT_STATE_DIMENSIONS = [
  'AROUSAL', 'NEGATIVE_VALENCE', 'ANXIETY_PROXY', 'PAUSE_LOAD',
  'PITCH_VARIABILITY', 'VOICE_QUALITY', 'PHONATION_INSTABILITY',
  'AUDIO_TEXT_INCONGRUENCE',
] as const;

export type ClientStateDimension = typeof CLIENT_STATE_DIMENSIONS[number];

export interface ClientStateProvenance {
  window: string;
  cutoff_sec: number | null;
  client_role: string | null;
  /** Доля посчитанных измерений — показывается рядом с reliability. */
  reliability_fraction: number | null;
  /** Оговорка, без которой карточку показывать нельзя. */
  not_a_probability: string | null;
}

export interface ClientState {
  status: string;
  /** Считается по доле посчитанных измерений, а не по уверенности модели. */
  reliability: Reliability;
  /** Перцентили относительно эталонной выборки, а НЕ вероятность мошенничества. */
  scores_0_100: Partial<Record<ClientStateDimension, number | null>>;
  dimensions_available: number | null;
  dimensions_total: number | null;
  /** Без них «нет значения» неотличимо от «посчитано и оказалось пустым». */
  missing_features: string[];
  provenance: ClientStateProvenance | null;
}

export interface Evidence {
  state: string;
  evidence_gap_count: number | null;
  semantic_abstain: boolean;
  /**
   * Ключевое поле. Пока false — диагностических вопросов не распознаётся
   * ни одного, и NO_DIAGNOSTIC_EVIDENCE означает предел наших
   * возможностей, а не факт про разговор.
   */
  classifier_available: boolean;
  supported_core_domains: string[];
  /** Текст для показа. Своими словами состояние не пересказываем. */
  state_reason: string | null;
}

export interface NextQuestion {
  domain: string;
  text: string;
  /** Объясняет, почему выбран именно этот вопрос. */
  qds: number | null;
  components: string[];
}

/**
 * PRIMARY-слой кейса 1 — то, что показывается как основной результат.
 *
 * Считается только по речи клиента в первые 60 секунд. `primary_score` —
 * ранговая величина, а не вероятность, поэтому процентом её подписывать
 * нельзя. `decision_status` важнее числа: при INSUFFICIENT_EVIDENCE
 * оценка не выносится, сколько бы ни показывал score.
 */
export interface Case1Primary {
  /** OK · PRIMARY_MODEL_UNAVAILABLE · … */
  status: string;
  model_id?: string | null;
  product_role?: string | null;
  primary_score?: number | null;
  score_is_probability?: boolean | null;
  /**
   * Вердикт модели: INSUFFICIENT_EVIDENCE, NOT_INFLUENCED_HIGH_CONFIDENCE,
   * REVIEW_REQUIRED, POSSIBLE_INFLUENCE.
   */
  decision_status?: string | null;
  /** Машинная причина отказа: LOW_CLIENT_WORD_COUNT и подобные. */
  evidence_status?: string | null;
  reason?: string | null;
  note?: string | null;
}

export const CASE1_DECISION_LABEL: Record<string, string> = {
  INSUFFICIENT_EVIDENCE: 'Недостаточно данных для оценки',
  NOT_INFLUENCED_HIGH_CONFIDENCE: 'Признаков воздействия не выявлено',
  REVIEW_REQUIRED: 'Требуется проверка оператором',
  POSSIBLE_INFLUENCE: 'Возможно внешнее воздействие',
};

export interface Case1Response {
  /** Основной слой. Именно он показывается как результат кейса 1. */
  primary?: Case1Primary | null;
  /** Исследовательский слой. Как основной результат не используется. */
  legacy?: Record<string, unknown> | null;
  job_id: string;
  call_id: string;
  operator_id: string;
  case_id: string;
  influence: Influence | null;
  client_state: ClientState | null;
  evidence: Evidence | null;
  /** Подсказка оператору, не предписание. */
  next_question: NextQuestion | null;
}

export const INFLUENCE_STATUS_LABEL: Record<string, string> = {
  OK: 'Оценка получена',
  ABSTAIN: 'Оценка не выносится',
};

export const RELIABILITY_LABEL: Record<string, string> = {
  HIGH: 'высокая',
  MEDIUM: 'средняя',
  LOW: 'низкая',
};

/** Человеческие названия измерений карточки состояния. */
export const DIMENSION_LABEL: Record<string, string> = {
  AROUSAL: 'Возбуждение',
  NEGATIVE_VALENCE: 'Негативная валентность',
  ANXIETY_PROXY: 'Косвенная тревожность',
  PAUSE_LOAD: 'Нагрузка паузами',
  PITCH_VARIABILITY: 'Изменчивость высоты голоса',
  VOICE_QUALITY: 'Качество голоса',
  PHONATION_INSTABILITY: 'Неустойчивость фонации',
  AUDIO_TEXT_INCONGRUENCE: 'Расхождение голоса и текста',
};

// ---------- Журнал ----------

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

// ---------- Кейс 2: личная история сотрудника ----------

/**
 * Сотрудник в списке демонстрационного корпуса.
 *
 * Метка выгорания (CONTROL) неизвестна: сервис отдаёт null либо статус
 * «неизвестно». Придумывать её на фронтенде нельзя — ни по числам, ни
 * по динамике.
 */
export interface Employee {
  employee_id: string;
  /** Число звонков в истории, если сервис его сообщает. */
  calls_count?: number | null;
  n_calls?: number | null;
  label?: string | null;
  label_status?: string | null;
  role?: string | null;
}

/**
 * Один звонок в личной истории.
 *
 * Поля supporting-метрик объясняют состояние и динамику, но в PRIMARY
 * risk по Acoustic11 не входят — подписывать их как причину оценки
 * нельзя.
 */
export interface EmployeeCall {
  call_id?: string | null;
  job_id?: string | null;
  call_datetime?: string | null;
  risk_score?: number | null;
  risk_band?: string | null;
  anxiety_n_1?: number | null;
  emotional_balance?: number | null;
  hidden_negative_share?: number | null;
  [key: string]: unknown;
}

/** Ответы приходят и списком, и объектом-обёрткой. */
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
