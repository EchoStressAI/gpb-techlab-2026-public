import { useEffect, useState } from 'react';
import { color, radius } from '../../theme';
import type { Case2Primary, RiskAssessment, RiskResponse, XaiContribution } from '../../types';
import { RISK_STATUS_LABEL, isUsable } from '../../types';
import { getRisk } from '../../api/calls';
import { ApiError } from '../../api/client';
import { NO_DATA, int, num } from '../../utils/format';
import { Notice } from './UploadPanel';

/**
 * Оценка выгорания.
 *
 * Порядок чтения задан контрактом и здесь он буквальный:
 *
 *   1. usable_prediction — можно ли по оценке делать вывод. Это главное
 *      поле, а не risk_score. Пока оно не true, числа не показываются
 *      как оценка: на экране причина, а не цифра;
 *   2. risk_score — значение 0..1, не проценты и не вероятность.
 *      Без порога не читается, поэтому выводится только вместе с ним;
 *   3. probability_calibrated = false означает, что называть число
 *      вероятностью нельзя;
 *   4. banner берётся с сервера, а не пишется в вёрстке: когда модель
 *      пройдёт проверку, поле придёт null и предупреждение исчезнет само;
 *   5. explanation_type — вклады линейной модели; формулировки
 *      «потому что» недопустимы.
 */
export function RiskPanel({ jobId }: { jobId: string }) {
  const [data, setData] = useState<RiskResponse | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Запрос отменяется при уходе с вкладки: иначе ответ по прошлому
    // звонку мог бы прийти позже и лечь поверх текущего.
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    getRisk(jobId, ctrl.signal)
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

  if (loading) return <Muted>Загрузка оценки…</Muted>;

  if (error) {
    // Два разных 403 на одной ручке: различаются по required_scope.
    if (error instanceof ApiError && error.isForbidden) {
      const internal = error.requiredScope === 'risk:read_internal';
      return (
        <Notice tone="warning">
          {internal ? (
            <>
              Оценка по этому разговору посчитана, но её версия не допущена
              к показу: качество модели не подтверждено. Нужно право{' '}
              <code>{error.requiredScope}</code>.
            </>
          ) : (
            <>
              Просмотр оценки закрыт. Повторный вход не поможет — нужно право{' '}
              <code>{error.requiredScope ?? 'risk:read'}</code> от администратора.
            </>
          )}
        </Notice>
      );
    }
    return <Notice tone="error">{error.message}</Notice>;
  }

  if (!data) return null;

  // Основной слой кейса 2. Он и есть оценка: legacy-поле risk осталось
  // исследовательским и в его отсутствие говорить «модель не подключена»
  // нельзя — это разные слои ответа.
  const primary = data.primary ?? null;

  // Ни основного слоя, ни legacy: вот теперь оценки действительно нет.
  if (!primary && !data.risk) {
    return <Notice tone="info">Оценка недоступна: {data.reason ?? 'модель не подключена'}</Notice>;
  }

  if (!data.risk) {
    return <PrimaryBlock primary={primary as Case2Primary} />;
  }

  const r = data.risk;
  const usable = isUsable(r);

  return (
    <div>
      {primary && <PrimaryBlock primary={primary} />}
      {/* Текст предупреждения приходит с сервера. */}
      {r.banner && <Notice tone="warning">{r.banner}</Notice>}

      <Verdict risk={r} usable={usable} />

      {usable ? <Numbers risk={r} /> : <WithheldNumbers risk={r} />}

      {/* Прямое требование контракта: не подписывать число вероятностью. */}
      {usable && !r.probability_calibrated && (
        <Notice tone="info">
          Значение не откалибровано и не является вероятностью. Оно
          интерпретируется только в сравнении с порогом.
        </Notice>
      )}

      {r.imputed_features.length > 0 && (
        <Notice tone="warning">
          Признаков подставлено медианой: {r.imputed_features.length}. Чем их
          больше, тем меньше оценка опирается на этот разговор.
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
            {r.imputed_features.join(', ')}
          </div>
        </Notice>
      )}

      <div style={{
        marginTop: 16, background: color.chipBg, borderRadius: radius.inner,
        padding: '14px 16px', fontSize: 13, lineHeight: 1.7,
      }}>
        <Row label="Версия модели" value={r.model_version} mono />
        <Row label="Тип объяснения" value={r.provenance.explanation_type} mono />
        <Row
          label="Окно агрегации"
          value={
            r.provenance.aggregation_window_end_sec === null
              ? NO_DATA
              : `до ${r.provenance.aggregation_window_end_sec} сек`
          }
        />
        <Row label="Реплик в расчёте" value={int(r.provenance.n_replies_used)} />
        {/* internal_only — про применимость оценки, а не про доступ.
            Право у пользователя есть (иначе он получил бы 403), но
            сама модель к показу заказчику не допущена. */}
        <Row
          label="Допущена к показу заказчику"
          value={r.customer_visible ? 'да' : `нет${r.internal_only ? ' · только внутреннее использование' : ''}`}
        />
        <div style={{ marginTop: 10, opacity: 0.75 }}>
          Вклады признаков описывают поведение модели, а не причины состояния
          человека. Просмотр этой оценки записан в журнал.
        </div>
      </div>
    </div>
  );
}


/**
 * PRIMARY кейса 2.
 *
 * `risk_score` — относительный ранговый индекс: подписывать его
 * процентом вероятности выгорания прямо запрещено контрактом, поэтому
 * рядом с числом всегда стоит оговорка, а словесную полосу берём с
 * сервера как есть. Проверенная единица — период работы сотрудника, и
 * читать число как приговор одному звонку нельзя.
 */
function PrimaryBlock({ primary }: { primary: Case2Primary }) {
  if (primary.status !== 'OK') {
    return (
      <Notice tone="warning">
        Основная модель недоступна ({primary.status}).
        {primary.reason && <> {primary.reason}</>}
      </Notice>
    );
  }

  const score = typeof primary.risk_score === 'number' ? primary.risk_score : null;

  return (
    <div style={{
      marginTop: 16, borderRadius: radius.inner,
      border: `1px solid ${color.border}`, padding: '16px 18px',
    }}>
      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
        Относительный уровень риска
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {score === null ? NO_DATA : score.toFixed(3)}
        </div>
        {primary.risk_band && (
          <div style={{ fontSize: 16, opacity: 0.85 }}>{primary.risk_band}</div>
        )}
      </div>

      <div style={{ fontSize: 13, opacity: 0.75, marginTop: 8, lineHeight: 1.7 }}>
        Это ранговый индекс модели, а не вероятность выгорания
        {primary.score_is_probability === true ? '' : ' (score_is_probability = false)'}.
        Проверенная единица наблюдения — {primary.validated_unit ?? 'период работы сотрудника'},
        поэтому по одному разговору вывод о человеке не делается.
      </div>

      <div style={{
        marginTop: 12, background: color.chipBg, borderRadius: radius.inner,
        padding: '12px 14px', fontSize: 13, lineHeight: 1.7,
      }}>
        <Row label="Модель" value={primary.model_id ?? NO_DATA} mono />
        <Row
          label="Перцентиль относительно выборки"
          value={num(primary.reference_percentile, 2)}
        />
        {primary.note && <Row label="Примечание" value={primary.note} />}
      </div>

      <Xai xai={primary.xai ?? null} />
    </div>
  );
}

/**
 * Вклады признаков. Это поведение модели, а не причины состояния
 * человека — формулировки «потому что» здесь недопустимы.
 */
function Xai({ xai }: { xai: Case2Primary['xai'] }) {
  const positive = xai?.top_positive ?? [];
  const negative = xai?.top_negative ?? [];
  if (positive.length === 0 && negative.length === 0) return null;

  return (
    <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7 }}>
      <div style={{ opacity: 0.7, marginBottom: 6 }}>
        Вклады признаков в значение ({xai?.type ?? 'тип не указан'})
      </div>
      <ContribList title="Повышают" items={positive} tone={color.amber} />
      <ContribList title="Понижают" items={negative} tone={color.green} />
    </div>
  );
}

function ContribList({
  title, items, tone,
}: { title: string; items: XaiContribution[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <span style={{ color: tone, fontWeight: 600 }}>{title}: </span>
      {items.map(readContribution).map((c, i) => (
        <span key={`${c.name}-${i}`} style={{ opacity: 0.85 }}>
          {i > 0 && ' · '}
          {c.name}
          {c.value === null ? '' : ` ${c.value > 0 ? '+' : ''}${c.value.toFixed(3)}`}
        </span>
      ))}
    </div>
  );
}

/** Разбор одной записи вклада: сервис отдаёт и объект, и пару. */
function readContribution(c: XaiContribution): { name: string; value: number | null } {
  if (Array.isArray(c)) return { name: String(c[0]), value: Number(c[1]) };
  const name = c.feature ?? c.name ?? '—';
  const raw = c.contribution ?? c.value;
  return { name, value: typeof raw === 'number' ? raw : null };
}

/**
 * Первое, что видно на вкладке: годится ли оценка для вывода.
 *
 * При статусе INSUFFICIENT_PRIMARY_EVIDENCE причин две, и различить их
 * можно только по note — поэтому note показывается рядом со статусом,
 * а не среди подробностей внизу.
 */
function Verdict({ risk, usable }: { risk: RiskAssessment; usable: boolean }) {
  const tone = usable ? color.green : color.amber;
  const statusLabel = RISK_STATUS_LABEL[risk.status] ?? risk.status;

  return (
    <div style={{
      marginTop: 16, borderRadius: radius.inner,
      border: `1px solid ${tone}40`, background: `${tone}0F`,
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: tone }}>
        {usable
          ? 'По оценке можно делать вывод'
          : 'По оценке нельзя делать вывод'}
      </div>
      <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.7 }}>
        <span style={{ opacity: 0.65 }}>Статус: </span>
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>{risk.status}</span>
        {statusLabel !== risk.status && <span style={{ opacity: 0.8 }}> — {statusLabel}</span>}
      </div>
      {/* Причина словами. Для INSUFFICIENT_PRIMARY_EVIDENCE это
          единственный способ понять, чего именно не хватило. */}
      {risk.note && (
        <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.7 }}>{risk.note}</div>
      )}
      {!risk.note && !usable && (
        <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.7, opacity: 0.8 }}>
          Причина сервисом не указана.
        </div>
      )}
    </div>
  );
}

/** Числа показываются, только когда вывод по ним допустим. */
function Numbers({ risk }: { risk: RiskAssessment }) {
  const aboveThreshold =
    risk.risk_score !== null && risk.threshold !== null
      ? risk.risk_score >= risk.threshold
      : null;

  return (
    <div style={{
      marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
    }}>
      <Metric label="Оценка модели" value={num(risk.risk_score, 3)} note="значение от 0 до 1" />
      <Metric
        label="Порог отнесения"
        value={num(risk.threshold, 2)}
        note={
          aboveThreshold === null
            ? 'сравнение недоступно'
            : aboveThreshold
              ? 'оценка выше порога'
              : 'оценка ниже порога'
        }
        noteColor={aboveThreshold ? color.amber : color.green}
      />
      <Metric label="Класс" value={int(risk.predicted_class)} />
    </div>
  );
}

/**
 * Оценка есть, но выводом не является.
 *
 * Число не прячется совсем — оно нужно при разборе, — но подписано
 * как техническое и набрано так, чтобы его нельзя было принять
 * за результат.
 */
function WithheldNumbers({ risk }: { risk: RiskAssessment }) {
  const [open, setOpen] = useState(false);

  if (risk.risk_score === null) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <span
        onClick={() => setOpen((v) => !v)}
        style={{ fontSize: 13, color: color.orange, cursor: 'pointer' }}
      >
        {open ? 'Скрыть техническое значение' : 'Показать техническое значение'}
      </span>
      {open && (
        <div style={{
          marginTop: 8, background: color.chipBg, borderRadius: radius.inner,
          padding: '12px 14px', fontSize: 13, lineHeight: 1.7,
        }}>
          <Row label="risk_score" value={num(risk.risk_score, 3)} mono />
          <Row label="threshold" value={num(risk.threshold, 2)} mono />
          <Row label="predicted_class" value={int(risk.predicted_class)} mono />
          <div style={{ marginTop: 8, opacity: 0.75 }}>
            Значения приведены для разбора. Решения по ним принимать нельзя:
            сервис сообщил, что вывод по этой оценке не делается.
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '3px 0' }}>
      <span style={{ opacity: 0.65, minWidth: 190 }}>{label}</span>
      <span style={{ fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

function Metric({
  label, value, note, noteColor,
}: { label: string; value: string; note?: string; noteColor?: string }) {
  return (
    <div style={{ background: color.chipBg, borderRadius: radius.inner, padding: '14px 16px' }}>
      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {note && <div style={{ fontSize: 12, marginTop: 2, color: noteColor ?? color.inkMuted }}>{note}</div>}
    </div>
  );
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '20px 0', fontSize: 15, opacity: 0.7 }}>{children}</div>;
}
