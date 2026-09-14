import { useEffect, useState } from 'react';
import { color, radius } from '../../theme';
import { getCase1 } from '../../api/calls';
import { ApiError } from '../../api/client';
import {
  CASE1_DECISION_LABEL, CLIENT_STATE_DIMENSIONS, DIMENSION_LABEL,
  INFLUENCE_STATUS_LABEL, RELIABILITY_LABEL,
} from '../../types';
import type {
  Case1Primary, Case1Response, ClientState, Evidence, Influence, NextQuestion,
} from '../../types';
import { Notice } from './UploadPanel';

/**
 * Экран кейса 1.
 *
 * Четыре слоя показаны рядом, но раздельно и без общего вывода:
 * карточка состояния и достаточность сведений в оценку воздействия не
 * входят, и подавать их как её обоснование нельзя. Слой, который не
 * считался, приходит как null целиком — тогда вместо него стоит прочерк
 * с причиной, а не нули.
 */
export function Case1Panel({ jobId }: { jobId: string }) {
  const [data, setData] = useState<Case1Response | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    getCase1(jobId, ctrl.signal)
      .then(setData)
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [jobId]);

  if (loading) return <div style={{ fontSize: 15, opacity: 0.7 }}>Загрузка…</div>;

  if (error instanceof ApiError) {
    if (error.isForbidden) {
      return (
        <Notice tone="warning">
          Экран кейса 1 закрыт: не хватает права{' '}
          <code>{error.requiredScope ?? 'risk:read'}</code>.
        </Notice>
      );
    }
    return <Notice tone="error">{error.message}</Notice>;
  }
  if (error) return <Notice tone="error">Не удалось получить данные кейса 1</Notice>;
  if (!data) return null;

  // Все четыре слоя пусты — это не пропажа данных, а другой кейс.
  // Для CASE_2 слой влияния, карточка состояния и слой сведений не
  // применяются: сервис так и пишет в пропущенных стадиях. Показывать
  // вместо этого четыре прочерка — значит выдавать штатный ответ за
  // неполадку.
  const nothingApplies =
    !data.primary && !data.influence && !data.client_state
    && !data.evidence && !data.next_question;

  if (nothingApplies) {
    return (
      <Notice tone="info">
        Экран кейса 1 к этой записи не применяется: она обработана как{' '}
        <b>{data.case_id || 'другой кейс'}</b>. Слой влияния, карточка состояния
        клиента и слой достаточности сведений считаются только для записей
        кейса 1 — причина видна в разделе «Стадии» на вкладке «Результат».
      </Notice>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <PrimaryBlock primary={data.primary ?? null} />
      <InfluenceBlock influence={data.influence} />
      <ClientStateBlock state={data.client_state} />
      <EvidenceBlock evidence={data.evidence} />
      <NextQuestionBlock question={data.next_question} />
    </div>
  );
}

// ---------- Основной слой ----------

/**
 * PRIMARY кейса 1 — единственный слой, по которому читают результат.
 *
 * Вердикт важнее числа и стоит выше него: при INSUFFICIENT_EVIDENCE
 * оценка не выносится, и score рядом с ней показывается только как
 * служебная величина. Процентом он не подписывается — это ранговое
 * значение, а не вероятность.
 */
function PrimaryBlock({ primary }: { primary: Case1Primary | null }) {
  if (!primary) {
    return (
      <Section title="Основная оценка">
        <Missing>Основной слой не пришёл в ответе сервиса</Missing>
      </Section>
    );
  }

  if (primary.status !== 'OK') {
    return (
      <Section title="Основная оценка">
        <Notice tone="warning">
          Основная модель недоступна ({primary.status}). Исследовательский
          слой ниже её не заменяет и основным результатом не является.
          {primary.reason && <> {primary.reason}</>}
        </Notice>
      </Section>
    );
  }

  const decision = primary.decision_status ?? '';
  const abstain = decision === 'INSUFFICIENT_EVIDENCE';

  return (
    <Section title="Основная оценка">
      <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.3 }}>
        {CASE1_DECISION_LABEL[decision] ?? decision ?? 'Вердикт не указан'}
      </div>

      {abstain && (
        <Notice tone="info">
          Оценка не выносится: данных в записи не хватает. Это ответ модели,
          а не ноль и не «низкий риск».
          {primary.evidence_status && <> Причина: {primary.evidence_status}.</>}
        </Notice>
      )}

      {typeof primary.primary_score === 'number' && (
        <div style={{ marginTop: 12, fontSize: 15 }}>
          <span style={{ opacity: 0.7 }}>Ранговая величина: </span>
          <span style={{ fontWeight: 700 }}>{primary.primary_score.toFixed(3)}</span>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
            Это порядковое значение относительно эталонной выборки, а не
            вероятность воздействия.
          </div>
        </div>
      )}

      <Rows rows={[
        ['Вердикт', decision || '—'],
        ['Модель', primary.model_id ?? '—'],
        ['Достаточность данных', primary.evidence_status ?? '—'],
        ['Примечание', primary.note ?? '—'],
      ]} />
    </Section>
  );
}

// ---------- Оценка воздействия (исследовательский слой) ----------

function InfluenceBlock({ influence }: { influence: Influence | null }) {
  if (!influence) {
    return (
      <Section title="Оценка воздействия">
        <Missing>Слой не считался</Missing>
      </Section>
    );
  }

  const abstain = influence.status !== 'OK';
  // Подпись величины задана владельцем продукта. Своими словами не
  // подписываем — именно так появляется слово «вероятность».
  const label = influence.provenance?.display_label ?? 'Оценка воздействия';

  return (
    <Section title="Оценка воздействия">
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 15, opacity: 0.75 }}>{label}</div>
        {abstain ? (
          <div style={{ fontSize: 20, fontWeight: 700, color: color.inkMuted }}>
            {INFLUENCE_STATUS_LABEL[influence.status] ?? influence.status}
          </div>
        ) : (
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {num(influence.risk_score_0_100)}
            <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.6 }}> из 100</span>
          </div>
        )}
      </div>

      {/* Оговорка о калибровке обязана стоять рядом с числом. */}
      {!abstain && !influence.probability_calibrated && (
        <Notice tone="warning">
          Модель не откалибрована: это порядковая величина по шкале 0–100,
          а не вероятность воздействия.
        </Notice>
      )}

      {abstain && (
        <Notice tone="info">
          Оценка не выносится — это полноправный ответ, а не ноль и не
          «низкий риск».
          {influence.note && <> {influence.note}</>}
        </Notice>
      )}

      <Rows rows={[
        ['Статус', INFLUENCE_STATUS_LABEL[influence.status] ?? influence.status],
        ['Почему входа не хватило', influence.input_status],
        ['Действие', influence.operational_action],
        // Реплики показываем и при отказе: по ним видно, почему оценки нет.
        ['Реплик оператора в оценке',
          `${num(influence.operator_replies_used)} из ${num(influence.operator_replies_total)}`],
        ['Окно', influence.provenance?.window],
        ['Символов текста к отсечке', num(influence.provenance?.op60_text_chars)],
        ['Версия модели', influence.model_version],
      ]} />
    </Section>
  );
}

// ---------- Карточка состояния клиента ----------

function ClientStateBlock({ state }: { state: ClientState | null }) {
  if (!state) {
    return (
      <Section title="Состояние клиента">
        <Missing>Слой не считался</Missing>
      </Section>
    );
  }

  const fraction = state.provenance?.reliability_fraction;

  return (
    <Section title="Состояние клиента">
      {/* Без этой оговорки карточку показывать нельзя. Текст приходит
          от сервиса, своими словами не пересказывается. */}
      {state.provenance?.not_a_probability && (
        <Notice tone="warning">{state.provenance.not_a_probability}</Notice>
      )}

      <div style={{ fontSize: 15, marginBottom: 12 }}>
        Достоверность: <b>{RELIABILITY_LABEL[state.reliability] ?? state.reliability}</b>
        {/* «Низкая достоверность» без числа не объясняет, насколько низкая. */}
        {fraction != null && (
          <span style={{ opacity: 0.7 }}>
            {' '}— посчитано {num(state.dimensions_available)} измерений
            из {num(state.dimensions_total)}, доля {fraction.toFixed(3)}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        {CLIENT_STATE_DIMENSIONS.map((key) => {
          const value = state.scores_0_100[key];
          const measured = typeof value === 'number';
          return (
            <div key={key} style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 56px',
              gap: 12, alignItems: 'center', fontSize: 14,
            }}>
              <div>{DIMENSION_LABEL[key] ?? key}</div>
              <div style={{
                height: 8, borderRadius: 4, background: `${color.ink}12`, overflow: 'hidden',
              }}>
                {/* Не измерено — полоса пустая. Нулевая длина здесь
                    означала бы измеренный ноль, а это разные вещи. */}
                {measured && (
                  <div style={{
                    width: `${Math.max(0, Math.min(100, value))}%`,
                    height: '100%', background: color.orange,
                  }} />
                )}
              </div>
              <div style={{
                textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                opacity: measured ? 1 : 0.45,
              }}>
                {measured ? value.toFixed(0) : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {state.missing_features.length > 0 && (
        <details style={{ marginTop: 12, fontSize: 14 }}>
          <summary style={{ cursor: 'pointer', opacity: 0.75 }}>
            Каких признаков не хватило · {state.missing_features.length}
          </summary>
          <div style={{
            marginTop: 8, fontFamily: 'ui-monospace, monospace', fontSize: 12,
            opacity: 0.75, lineHeight: 1.8, wordBreak: 'break-all',
          }}>
            {state.missing_features.join(', ')}
          </div>
        </details>
      )}
    </Section>
  );
}

// ---------- Достаточность сведений ----------

function EvidenceBlock({ evidence }: { evidence: Evidence | null }) {
  if (!evidence) {
    return (
      <Section title="Достаточность сведений">
        <Missing>Слой не считался</Missing>
      </Section>
    );
  }

  return (
    <Section title="Достаточность сведений">
      {/* Пока классификатор не поставлен, это предел наших возможностей,
          а не факт про разговор. Показывать как «оператор не задал ни
          одного вопроса» нельзя — текст берём из state_reason. */}
      {!evidence.classifier_available && (
        <Notice tone="warning">
          {evidence.state_reason
            ?? 'Классификатор вопросов не поставлен: судить о разговоре по этому слою нельзя.'}
        </Notice>
      )}

      <Rows rows={[
        ['Состояние', evidence.state],
        ['Пробелов в сведениях', num(evidence.evidence_gap_count)],
        ['Классификатор вопросов', evidence.classifier_available ? 'поставлен' : 'не поставлен'],
        ['Смысловой отказ', evidence.semantic_abstain ? 'да' : 'нет'],
        ['Поддержанные области',
          evidence.supported_core_domains.length > 0
            ? evidence.supported_core_domains.join(', ')
            : null],
      ]} />
    </Section>
  );
}

// ---------- Следующий вопрос ----------

function NextQuestionBlock({ question }: { question: NextQuestion | null }) {
  if (!question) {
    return (
      <Section title="Следующий вопрос">
        <Missing>Подсказка не сформирована</Missing>
      </Section>
    );
  }

  return (
    <Section title="Следующий вопрос">
      <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8 }}>
        Подсказка оператору, не предписание
      </div>
      <div style={{
        fontSize: 16, lineHeight: 1.6, padding: '12px 14px',
        background: `${color.orange}0D`, borderRadius: radius.control,
      }}>
        {question.text}
      </div>
      <Rows rows={[
        ['Область', question.domain],
        ['Оценка выбора', num(question.qds)],
        ['Составляющие',
          question.components.length > 0 ? question.components.join(' · ') : null],
      ]} />
    </Section>
  );
}

// ---------- Общее ----------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: `1px solid ${color.border}80`, borderRadius: radius.control,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Rows({ rows }: { rows: [string, unknown][] }) {
  return (
    <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{
          display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12, fontSize: 14,
        }}>
          <div style={{ opacity: 0.65 }}>{label}</div>
          <div style={{ opacity: value == null || value === '' ? 0.45 : 1 }}>
            {value == null || value === '' ? '—' : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Missing({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, opacity: 0.6 }}>
      {children} — значения не подставляются
    </div>
  );
}

/** null — это «не измерено», а не ноль. В интерфейсе это прочерк. */
function num(value: number | null | undefined): string {
  return typeof value === 'number' ? String(value) : '—';
}
