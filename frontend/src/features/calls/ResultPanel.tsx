import { useEffect, useState } from 'react';
import { color, radius } from '../../theme';
import type { CallResult } from '../../types';
/**
 * Единственное окно, которое выводится на экране результата, — своё у
 * каждого сценария: кейс 1 читается по первым 60 секундам, кейс 2 — по
 * первым 180. Остальные окна сервис считает, но на экран они не идут.
 *
 * Кейс берётся из самого результата. Неизвестное значение трактуем как
 * кейс 2: подменять окно наугад хуже, чем оставить окно контракта.
 */
function shownWindow(caseId: string): string {
  return caseId === 'CASE_1' ? '0_60' : '0_180';
}
import { getResult } from '../../api/calls';
import { ApiError } from '../../api/client';
import { NO_DATA, dateTime, int, seconds } from '../../utils/format';
import { Notice } from './UploadPanel';
import { Muted } from './RiskPanel';

/**
 * Технический результат: что посчитано, на каком материале и с каким
 * качеством. Оценки и расшифровки здесь нет — у них свои права.
 *
 * features (176 полей) и longitudinal (102) целиком не выводятся:
 * показывается только количество, а значения отбираются по именам.
 */
export function ResultPanel({ jobId }: { jobId: string }) {
  const [data, setData] = useState<CallResult | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    getResult(jobId, ctrl.signal)
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

  if (loading) return <Muted>Загрузка результата…</Muted>;
  if (error) {
    if (error instanceof ApiError && error.status === 409) {
      return <Notice tone="info">Результата пока нет: {error.message}</Notice>;
    }
    if (error instanceof ApiError && error.isForbidden) {
      return (
        <Notice tone="warning">
          Технический результат закрыт. Нужно право{' '}
          <code>{error.requiredScope ?? 'calls:read'}</code>.
        </Notice>
      );
    }
    return <Notice tone="error">{error.message}</Notice>;
  }
  if (!data) return null;

  const lowSpeech = data.vad.qc_status === 'REVIEW_LOW_SPEECH';
  // Запасной способ разметки означает, что настоящая модель не подключена.
  const fallbackVad = data.vad.method === 'energy_fallback_demo';
  const shown = shownWindow(data.case_id);

  return (
    <div>
      {lowSpeech && (
        <Notice tone="warning">
          Речи в записи мало. Признаки посчитаны, но опираться на них рискованно.
        </Notice>
      )}
      {fallbackVad && (
        <Notice tone="warning">
          Разметка речи получена запасным способом: настоящая модель не подключена.
        </Notice>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16,
      }}>
        <Metric label="Длительность" value={seconds(data.audio.duration_sec, 1)} />
        <Metric label="Каналов" value={int(data.audio.channels)} />
        <Metric
          label="Частота"
          value={data.audio.sample_rate_hz === null ? NO_DATA : `${data.audio.sample_rate_hz} Гц`}
        />
        <Metric label="Обработка" value={seconds(data.elapsed_sec, 2)} />
      </div>

      <Section title="Материал расчёта">
        <Row label="Кейс" value={data.case_id} />
        <Row label="Сотрудник" value={data.operator_id} />
        <Row label="Время разговора" value={dateTime(data.call_datetime)} />
        <Row label="Идентификатор звонка" value={data.call_id} mono />
        <Row
          label="Реплик оператора"
          value={int(data.replies.SUPPORT_OPERATOR)}
        />
        <Row label="Реплик клиента" value={int(data.replies.CALLER)} />
        <Row label="Фрагментов" value={int(data.chunks)} />
        <Row label="Разметка речи" value={`${data.vad.method} · ${data.vad.qc_status}`} />
      </Section>

      <Section title="Окна расчёта">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.keys(data.windows)
            .filter((key) => key === shown)
            .map((key) => (
              <span key={key} style={{
                padding: '4px 12px', borderRadius: radius.pill, fontSize: 13,
                border: `1px solid ${color.ink}`,
                background: color.ink, color: '#FFFFFF',
              }}>
                {key.replace('_', '–')}
              </span>
            ))}
          {!(shown in data.windows) && (
            <span style={{ fontSize: 13, opacity: 0.7 }}>
              Окно {shown.replace('_', '–')} не рассчитано
            </span>
          )}
        </div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
          Признаков: {Object.keys(data.features).length} ·
          продольных: {Object.keys(data.longitudinal).length}
        </div>
      </Section>

      <Section title="Стадии">
        <StageList
          title="Посчитано"
          items={data.computed_stages}
          tone={color.green}
        />
        <StageList
          title="В заглушке"
          items={data.stubbed_stages}
          tone={color.amber}
          note="нет модели или артефакта — это честный пробел, а не сбой"
        />
        <StageList
          title="Пропущено"
          items={data.skipped_stages}
          tone={color.inkMuted}
          note="нечего было считать"
        />

        {data.stages.filter((s) => s.note).length > 0 && (
          <div style={{ marginTop: 12 }}>
            {data.stages.filter((s) => s.note).map((s) => (
              <div key={s.stage} style={{ fontSize: 13, lineHeight: 1.7 }}>
                <b>{s.stage}</b> — {s.note}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function StageList({
  title, items, tone, note,
}: { title: string; items: string[]; tone: string; note?: string }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: tone, marginBottom: 4 }}>
        {title} · {items.length}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.7 }}>{items.join(', ')}</div>
      {note && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${color.border}80` }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '3px 0', fontSize: 14 }}>
      <span style={{ opacity: 0.65, minWidth: 200 }}>{label}</span>
      <span style={{ fontFamily: mono ? 'ui-monospace, monospace' : 'inherit' }}>{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: color.chipBg, borderRadius: radius.inner, padding: '12px 14px' }}>
      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
