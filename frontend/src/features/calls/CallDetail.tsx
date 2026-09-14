import { useEffect, useState } from 'react';
import { color, radius, shadow } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { dateTime } from '../../utils/format';
import {
  getCase1, getEmployeeCalls, getResult, getRisk, getTranscript,
} from '../../api/calls';
import {
  CASE1_DECISION_LABEL, DIMENSION_LABEL, RELIABILITY_LABEL, caseInfo,
} from '../../types';
import type {
  CallResult, Case1Response, EmployeeCall, RiskResponse, Transcript,
  TranscriptTurn, XaiContribution,
} from '../../types';
import type { JobRow } from './useJobs';
import { Notice } from './UploadPanel';

/**
 * Разбор одной записи — одна страница без вкладок.
 *
 * Слои собираются из разных ручек, но читаются подряд: оценка, что её
 * сформировало, что делать дальше, история сотрудника и расшифровка.
 * Прятать часть за вкладками означало бы, что оговорку про величину
 * можно не увидеть, а вывод — увидеть.
 */
export function CallDetail({ job, onBack }: { job: JobRow; onBack: () => void }) {
  const { can } = useAuth();
  const caseId = detectCase(job) ?? 'CASE_2';
  const info = caseInfo(caseId);
  const windowLabel = caseId === 'CASE_1' ? '0–60 сек' : '0–180 сек';

  const [result, setResult] = useState<CallResult | null>(null);
  const [case1, setCase1] = useState<Case1Response | null>(null);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [history, setHistory] = useState<EmployeeCall[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    const quiet = () => undefined;

    if (can('calls:read')) {
      getResult(job.job_id, ac.signal).then(setResult).catch((e) => {
        if (!(e instanceof DOMException)) setError(e?.message ?? null);
      });
    }
    if (can('transcript:read')) {
      getTranscript(job.job_id, ac.signal).then(setTranscript).catch(quiet);
    }
    if (can('risk:read')) {
      // Ручка зависит от кейса: /risk — риск выгорания, поле кейса 2, и
      // для кейса 1 оно принципиально пусто.
      if (caseId === 'CASE_1') {
        getCase1(job.job_id, ac.signal).then(setCase1).catch(quiet);
      } else {
        getRisk(job.job_id, ac.signal).then(setRisk).catch(quiet);
      }
    }
    return () => ac.abort();
  }, [job.job_id, caseId, can]);

  // Личная история — только кейс 2 и только на момент этого разговора:
  // звонки, которых на тот момент ещё не было, в разборе показывать
  // нельзя, иначе вывод опирался бы на будущее.
  useEffect(() => {
    if (caseId !== 'CASE_2') return;
    const employee = result?.operator_id ?? job.operator_id;
    if (!employee || employee === '—') return;
    const ac = new AbortController();
    getEmployeeCalls(employee, result?.call_datetime ?? undefined, ac.signal)
      .then((list) => setHistory([...list].sort((a, b) => callTime(a) - callTime(b))))
      .catch(() => undefined);
    return () => ac.abort();
  }, [caseId, result?.operator_id, result?.call_datetime, job.operator_id]);

  const when = result?.call_datetime ? dateTime(result.call_datetime) : null;
  const roles = rolesLine(transcript);

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px 0' }}>
      <div
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16,
          color: color.orange, cursor: 'pointer', marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>←</span> К списку записей
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <Card>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 20, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{job.filename}</div>
            <div style={{ fontSize: 14, opacity: 0.7, marginTop: 6, lineHeight: 1.7 }}>
              Сотрудник {result?.operator_id ?? job.operator_id}
              {/* Время разговора, а не время загрузки: для банковской
                  выгрузки это разные моменты, иногда на годы. */}
              {when && <> · разговор {when}</>}
              {job.submitted_by !== '—' && <> · загрузил {job.submitted_by}</>}
              <br />
              <span style={{ fontFamily: MONO, fontSize: 13 }}>
                job {job.job_id} · call {job.call_id}
                {roles && <> · каналы {roles}</>}
              </span>
            </div>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
          }}>
            <span style={{
              display: 'inline-block', padding: '5px 14px', borderRadius: radius.pill,
              fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
              color: caseId === 'CASE_1' ? color.blue : color.orange,
              background: `${caseId === 'CASE_1' ? color.blue : color.orange}14`,
            }}>
              {caseId} · {info.title}
            </span>
            <span style={{ fontSize: 13, opacity: 0.7 }}>
              окно анализа {windowLabel}
            </span>
          </div>
        </div>
      </Card>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 16, marginBottom: 16,
      }}>
        <ScoreCard caseId={caseId} case1={case1} risk={risk} windowLabel={windowLabel} />
        <StateCard caseId={caseId} case1={case1} risk={risk} result={result} />
      </div>

      <SeenCard caseId={caseId} case1={case1} risk={risk} />

      <NextCard case1={case1} />

      {caseId === 'CASE_2' && history && history.length > 0 && (
        <HistoryCard employee={result?.operator_id ?? job.operator_id} calls={history} />
      )}

      <TranscriptCard transcript={transcript} roles={roles} windowLabel={windowLabel} />
    </div>
  );
}

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// ---------- Итоговая оценка ----------

/**
 * Число модели.
 *
 * Ни в одном сценарии оно не является вероятностью, поэтому шкала
 * подписана диапазоном, а не процентом, и под ней всегда стоит
 * оговорка. Вердикт стоит рядом с числом: при отказе от оценки читать
 * надо именно его.
 */
function ScoreCard({
  caseId, case1, risk, windowLabel,
}: {
  caseId: 'CASE_1' | 'CASE_2';
  case1: Case1Response | null;
  risk: RiskResponse | null;
  windowLabel: string;
}) {
  const primary = caseId === 'CASE_1' ? case1?.primary : risk?.primary;

  if (!primary) {
    return (
      <Card compact>
        <Kicker>Итоговая оценка · {windowLabel}</Kicker>
        <div style={{ marginTop: 12, fontSize: 15, opacity: 0.7 }}>
          Основной слой ещё не получен
        </div>
      </Card>
    );
  }

  if (primary.status !== 'OK') {
    return (
      <Card compact>
        <Kicker>Итоговая оценка · {windowLabel}</Kicker>
        <div style={{ marginTop: 12, fontSize: 17, fontWeight: 600 }}>
          Модель недоступна
        </div>
        <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, opacity: 0.8 }}>
          {primary.status}. Исследовательский слой её не заменяет и основным
          результатом не является.
        </div>
      </Card>
    );
  }

  const isCase1 = caseId === 'CASE_1';
  const score = isCase1
    ? (case1?.primary?.primary_score ?? null)
    : (risk?.primary?.risk_score ?? null);

  const decision = case1?.primary?.decision_status ?? '';
  const abstain = isCase1 && decision === 'INSUFFICIENT_EVIDENCE';

  const verdict = isCase1
    ? (CASE1_DECISION_LABEL[decision] ?? decision ?? 'Вердикт не указан')
    : (risk?.primary?.risk_band ?? 'Полоса не указана');

  const tone = abstain ? color.inkMuted : scoreTone(score);

  return (
    <Card compact>
      <Kicker>Итоговая оценка · {windowLabel}</Kicker>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
        <div style={{
          fontSize: 54, fontWeight: 700, lineHeight: 1, color: tone,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {score === null ? '—' : score.toFixed(2)}
        </div>
        <div style={{ fontSize: 16, opacity: 0.6 }}>/ 1.00</div>
      </div>

      <Track value={score ?? 0} tone={tone} height={10} />

      <div style={{ fontSize: 14, marginTop: 12, lineHeight: 1.6 }}>
        <b style={{ color: tone }}>{verdict}</b>
        <br />
        {primary.model_id && <>модель {primary.model_id}</>}
        {!isCase1 && typeof risk?.primary?.reference_percentile === 'number' && (
          <> · перцентиль {risk.primary.reference_percentile.toFixed(2)}</>
        )}
        {isCase1 && case1?.primary?.evidence_status && (
          <> · достаточность данных {case1.primary.evidence_status}</>
        )}
      </div>

      {/*
        Оговорка о величине обязательна и не прячется: ни primary_score,
        ни risk_score вероятностью не являются, и именно отсюда берётся
        соблазн прочитать «0.87» как 87%.
      */}
      <div style={{
        marginTop: 12, background: `${color.amber}0F`,
        border: `1px solid ${color.amber}33`, borderRadius: radius.inner,
        padding: '10px 14px', fontSize: 13, lineHeight: 1.6, color: '#8A4A00',
      }}>
        {abstain
          ? 'Оценка не выносится: данных в записи не хватает. Это ответ модели, а не ноль и не «низкий риск».'
          : 'Число не вероятность: score_is_probability = false. Это ранговая величина относительно эталонной выборки.'}
      </div>
    </Card>
  );
}

/**
 * Светофор по рангу: пороги 0.33 и 0.66, заданные владельцем продукта.
 * Те же значения используются в таблице записей — расхождение цвета
 * между списком и разбором читалось бы как разные оценки.
 */
function scoreTone(score: number | null): string {
  if (score === null) return color.ink;
  if (score >= 0.66) return color.red;
  if (score >= 0.33) return color.amber;
  return color.green;
}

// ---------- Состояние ----------

/**
 * Состояние участника разговора.
 *
 * Для кейса 1 это измерения состояния клиента в перцентилях
 * относительно эталонной выборки — не вероятность мошенничества. Для
 * кейса 2 — supporting-метрики, которые объясняют состояние, но в
 * основной расчёт риска не входят.
 */
function StateCard({
  caseId, case1, risk, result,
}: {
  caseId: 'CASE_1' | 'CASE_2';
  case1: Case1Response | null;
  risk: RiskResponse | null;
  result: CallResult | null;
}) {
  const isCase1 = caseId === 'CASE_1';

  const chips: { label: string; tone: string }[] = [];
  const metrics: { label: string; value: string; fraction: number | null }[] = [];

  if (isCase1) {
    const state = case1?.client_state ?? null;
    if (state) {
      chips.push({
        label: `надёжность: ${RELIABILITY_LABEL[state.reliability] ?? state.reliability}`,
        tone: color.blue,
      });
      if (state.dimensions_available !== null && state.dimensions_total !== null) {
        chips.push({
          label: `измерений ${state.dimensions_available} из ${state.dimensions_total}`,
          tone: color.ink,
        });
      }
      Object.entries(state.scores_0_100).forEach(([key, value]) => {
        if (typeof value !== 'number') return;
        metrics.push({
          label: DIMENSION_LABEL[key] ?? key,
          value: value.toFixed(0),
          fraction: value / 100,
        });
      });
    }
  } else {
    const p = risk?.primary ?? null;
    if (p?.risk_band) chips.push({ label: p.risk_band, tone: color.orange });
    if (p?.validated_unit) {
      chips.push({ label: `единица: ${p.validated_unit}`, tone: color.ink });
    }
    SUPPORTING.forEach(([key, label]) => {
      const value = result?.features?.[key];
      if (typeof value !== 'number') return;
      metrics.push({
        label,
        value: value.toFixed(2),
        fraction: value >= 0 && value <= 1 ? value : null,
      });
    });
  }

  return (
    <Card compact>
      <Kicker>{isCase1 ? 'Состояние клиента' : 'Состояние сотрудника'}</Kicker>

      {chips.length === 0 && metrics.length === 0 ? (
        <div style={{ marginTop: 12, fontSize: 15, opacity: 0.7 }}>
          Сервис не вернул измерений состояния
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {chips.map((c) => (
              <div key={c.label} style={{
                padding: '6px 14px', borderRadius: radius.pill, fontSize: 14,
                fontWeight: 600, color: c.tone, background: `${c.tone}14`,
              }}>
                {c.label}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
            {metrics.map((m) => (
              <div key={m.label}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 14, marginBottom: 5,
                }}>
                  <span>{m.label}</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {m.value}
                  </span>
                </div>
                {m.fraction !== null && (
                  <Track value={m.fraction} tone={color.ink} height={8} />
                )}
              </div>
            ))}
          </div>

          {isCase1 && (
            <div style={{ marginTop: 14, fontSize: 12, opacity: 0.6, lineHeight: 1.6 }}>
              Перцентили относительно эталонной выборки, а не вероятность
              воздействия.
            </div>
          )}
          {!isCase1 && metrics.length > 0 && (
            <div style={{ marginTop: 14, fontSize: 12, opacity: 0.6, lineHeight: 1.6 }}>
              Объясняют состояние и динамику, но в основной расчёт риска не входят.
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/** Supporting-метрики кейса 2 из плоского набора признаков. */
const SUPPORTING: [string, string][] = [
  ['anxiety_n_1', 'Тревожность'],
  ['emotional_balance', 'Эмоциональный баланс'],
  ['hidden_negative_share', 'Доля скрытого негатива'],
];

// ---------- Что сформировало оценку ----------

/**
 * Вклады признаков.
 *
 * Это поведение модели, а не причины состояния человека, и подпись об
 * этом стоит рядом с заголовком. Для кейса 2 сервис отдаёт точные
 * аддитивные вклады; для кейса 1 такого разложения в контракте нет —
 * там показывается, на чём основан вывод и чего не хватило.
 */
function SeenCard({
  caseId, case1, risk,
}: {
  caseId: 'CASE_1' | 'CASE_2';
  case1: Case1Response | null;
  risk: RiskResponse | null;
}) {
  if (caseId === 'CASE_2') {
    const xai = risk?.primary?.xai ?? null;
    const items = [
      ...(xai?.top_positive ?? []).map((c) => ({ ...readContribution(c), positive: true })),
      ...(xai?.top_negative ?? []).map((c) => ({ ...readContribution(c), positive: false })),
    ].filter((c) => c.value !== null);

    if (items.length === 0) return null;

    const max = Math.max(...items.map((c) => Math.abs(c.value ?? 0)), 0.0001);

    return (
      <Card>
        <CardHead
          title="Что система увидела в речи"
          hint={`вклады линейной модели (${xai?.type ?? 'тип не указан'}), не причины состояния`}
        />
        <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          {items.map((c, i) => (
            <div key={`${c.name}-${i}`} style={{
              display: 'grid', gridTemplateColumns: '240px 1fr 90px', gap: 16,
              alignItems: 'center', paddingBottom: 14,
              borderBottom: `1px solid ${color.border}80`,
            }}>
              <div style={{ fontSize: 13, fontFamily: MONO, opacity: 0.8 }}>{c.name}</div>
              <Track
                value={Math.abs(c.value ?? 0) / max}
                tone={c.positive ? color.amber : color.green}
                height={6}
              />
              <div style={{
                fontSize: 15, fontWeight: 700, textAlign: 'right',
                color: c.positive ? color.amber : color.green,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {(c.value ?? 0) > 0 ? '+' : ''}{(c.value ?? 0).toFixed(3)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6, lineHeight: 1.6 }}>
          Положительные вклады повышают значение, отрицательные понижают.
        </div>
      </Card>
    );
  }

  const evidence = case1?.evidence ?? null;
  if (!evidence) return null;

  return (
    <Card>
      <CardHead
        title="На чём основан вывод"
        hint="достаточность данных, а не причины поведения клиента"
      />
      <div style={{ marginTop: 14, fontSize: 15, lineHeight: 1.7 }}>
        {/* Текст состояния берём с сервера: своими словами вывод модели
            не пересказываем. */}
        {evidence.state_reason ?? evidence.state}
      </div>
      <div style={{ marginTop: 12, fontSize: 14, opacity: 0.8, lineHeight: 1.7 }}>
        Пропусков в данных: {evidence.evidence_gap_count ?? '—'}
        {evidence.classifier_available === false && (
          <>
            <br />
            Классификатор диагностических вопросов не подключён: вывод ограничен
            возможностями сервиса, а не содержанием разговора.
          </>
        )}
      </div>
    </Card>
  );
}

function readContribution(c: XaiContribution): { name: string; value: number | null } {
  if (Array.isArray(c)) return { name: String(c[0]), value: Number(c[1]) };
  const name = c.feature ?? c.name ?? '—';
  const raw = c.contribution ?? c.value;
  return { name, value: typeof raw === 'number' ? raw : null };
}

// ---------- Что делать дальше ----------

/**
 * Подсказка оператору.
 *
 * Показывается только то, что вернул сервис. Своих рекомендаций
 * интерфейс не сочиняет: за формулировками стоит скрипт, а не наша
 * догадка о разговоре.
 */
function NextCard({ case1 }: { case1: Case1Response | null }) {
  const q = case1?.next_question ?? null;
  if (!q) return null;

  return (
    <Card>
      <CardHead title="Следующий вопрос клиенту" hint="подсказка, не предписание" />
      <div style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        background: color.chipBg, borderRadius: radius.inner,
        padding: '14px 16px', marginTop: 14,
      }}>
        <div style={{
          minWidth: 26, height: 26, borderRadius: '50%', background: color.ink,
          color: '#FFFFFF', fontSize: 14, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          ?
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6 }}>{q.text}</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6, lineHeight: 1.6 }}>
            область {q.domain}
            {q.components.length > 0 && <> · {q.components.join(', ')}</>}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------- История сотрудника ----------

/**
 * История на момент этого разговора.
 *
 * Звонки после него не показываются: разбор не должен опираться на то,
 * чего на тот момент ещё не произошло. Столбцы — относительные индексы,
 * и подписаны они именно так.
 */
function HistoryCard({ employee, calls }: { employee: string; calls: EmployeeCall[] }) {
  const scored = calls.filter((c) => typeof c.risk_score === 'number');
  if (scored.length === 0) return null;

  const max = Math.max(...scored.map((c) => c.risk_score as number), 0.0001);

  return (
    <Card>
      <CardHead
        title={`История сотрудника ${employee}`}
        hint="на момент этого разговора, без последующих звонков"
      />
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 10, height: 150,
        margin: '20px 0 6px',
      }}>
        {scored.slice(-12).map((c, i) => {
          const value = c.risk_score as number;
          return (
            <div key={c.call_id ?? i} style={{
              flex: '1 1 0', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8, height: '100%',
              justifyContent: 'flex-end',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: color.ink }}>
                {value.toFixed(2)}
              </div>
              <div style={{
                width: '100%', maxWidth: 46,
                height: `${Math.max(6, (value / max) * 100)}%`,
                borderRadius: '8px 8px 0 0', background: color.ink,
              }} />
              <div style={{ fontSize: 12, opacity: 0.6, textAlign: 'center' }}>
                {shortDate(c.call_datetime)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 14, background: `${color.blue}0F`,
        border: `1px solid ${color.blue}33`, borderRadius: radius.inner,
        padding: '12px 14px', fontSize: 14, lineHeight: 1.6,
      }}>
        Проверенная единица наблюдения — период работы сотрудника. Столбцы
        показывают относительные индексы модели, а не вероятность выгорания, и
        вывод о человеке по одному столбцу не делается.
      </div>
    </Card>
  );
}

// ---------- Расшифровка ----------

function TranscriptCard({
  transcript, roles, windowLabel,
}: { transcript: Transcript | null; roles: string | null; windowLabel: string }) {
  const turns = transcript?.turns ?? [];

  return (
    <Card>
      <CardHead
        title="Расшифровка"
        hint={[
          roles ? `роли каналов: ${roles}` : null,
          `окно анализа ${windowLabel}`,
        ].filter(Boolean).join(' · ')}
      />
      {turns.length === 0 ? (
        <div style={{ marginTop: 14, fontSize: 15, opacity: 0.7 }}>
          Расшифровка недоступна
        </div>
      ) : (
        <div style={{ display: 'grid', marginTop: 4 }}>
          {turns.map((t) => (
            <div key={t.reply_id} style={{
              display: 'grid', gridTemplateColumns: '92px 132px 1fr', gap: 14,
              alignItems: 'start', padding: '12px 0',
              borderTop: `1px solid ${color.border}80`,
            }}>
              <div style={{ fontSize: 13, fontFamily: MONO, opacity: 0.6 }}>
                {clock(t.start_sec)}–{clock(t.end_sec)}
              </div>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: isClient(t) ? color.blue : color.ink,
              }}>
                {speakerLabel(t)} · канал {t.channel_index}
              </div>
              {/*
                Текст показываем только когда сервис считает его пригодным
                для выводов. Иначе — причина, а не пустая строка: молчание в
                расшифровке неотличимо от «ничего не сказал».
              */}
              <div style={{ fontSize: 15, lineHeight: 1.65 }}>
                {t.semantic_text_observable && t.text
                  ? t.text
                  : (
                    <span style={{ opacity: 0.55 }}>
                      текст недоступен ({t.asr_status})
                    </span>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- Мелочи ----------

function Card({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div style={{
      background: color.card, borderRadius: radius.card, boxShadow: shadow.card,
      padding: '20px 24px', marginBottom: compact ? 0 : 16,
    }}>
      {children}
    </div>
  );
}

function CardHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      {hint && <div style={{ fontSize: 13, opacity: 0.6 }}>{hint}</div>}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 600, letterSpacing: '.04em',
      textTransform: 'uppercase', opacity: 0.55,
    }}>
      {children}
    </div>
  );
}

/** Полоса значения. Доля приходит уже нормированной в 0…1. */
function Track({ value, tone, height }: { value: number; tone: string; height: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div style={{
      height, borderRadius: radius.pill, background: color.track,
      overflow: 'hidden', marginTop: 8,
    }}>
      <div style={{
        height: '100%', borderRadius: radius.pill, background: tone, width: `${pct}%`,
      }} />
    </div>
  );
}

function detectCase(job: JobRow): 'CASE_1' | 'CASE_2' | null {
  if (job.case_id === 'CASE_1' || job.case_id === 'CASE_2') return job.case_id;
  const id = job.call_id?.toLowerCase() ?? '';
  if (id.endsWith('_case_1')) return 'CASE_1';
  if (id.endsWith('_case_2')) return 'CASE_2';
  return null;
}

/** Соответствие каналов и ролей — по фактической расшифровке. */
function rolesLine(transcript: Transcript | null): string | null {
  const turns = transcript?.turns ?? [];
  if (turns.length === 0) return null;
  const byChannel = new Map<number, string>();
  turns.forEach((t) => {
    if (!byChannel.has(t.channel_index)) {
      byChannel.set(t.channel_index, speakerLabel(t).toLowerCase());
    }
  });
  return [...byChannel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ch, role]) => `${ch}:${role}`)
    .join(' · ');
}

/** Клиент — звонящая сторона; для кейса 2 это внешний собеседник. */
function isClient(t: TranscriptTurn): boolean {
  return t.speaker_role === 'CALLER';
}

function speakerLabel(t: TranscriptTurn): string {
  return isClient(t) ? 'Клиент' : 'Оператор';
}

function clock(sec: number): string {
  const total = Math.max(0, Math.round(sec));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function shortDate(raw: string | null | undefined): string {
  if (!raw) return '—';
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return '—';
  const d = new Date(t);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function callTime(c: EmployeeCall): number {
  const t = c.call_datetime ? Date.parse(c.call_datetime) : NaN;
  return Number.isFinite(t) ? t : 0;
}
