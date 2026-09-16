import { useEffect, useState } from 'react';
import { color, radius } from '../../theme';
import type { RiskResponse } from '../../types';
import { getRisk } from '../../api/calls';
import { ApiError } from '../../api/client';
import { Notice } from './UploadPanel';
import { Case2ExplanationBlock, case2PublicExplanation } from './PublicExplanation';

/**
 * Public-safe CASE 2 panel.
 *
 * В публичном UI остаются PRIMARY score/band, model id, reference percentile
 * и human-readable semantic explanation. Exact thresholds, imputed feature
 * names, numeric feature contributions and research-only/legacy outputs
 * intentionally stay inside the local runtime.
 */
export function RiskPanel({ jobId }: { jobId: string }) {
  const [data, setData] = useState<RiskResponse | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  if (error instanceof ApiError && error.isForbidden) {
    return <Notice tone="warning">Просмотр оценки закрыт: требуется право {error.requiredScope ?? 'risk:read'}.</Notice>;
  }
  if (error) return <Notice tone="error">{error.message}</Notice>;

  const primary = data?.primary ?? null;
  if (!primary) return <Notice tone="info">Основной результат не получен.</Notice>;
  if (primary.status !== 'OK') {
    return <Notice tone="warning">Основная модель недоступна или данных недостаточно: {primary.status}.</Notice>;
  }
  const explanation = case2PublicExplanation(primary);

  return (
    <div style={{
      border: `1px solid ${color.border}`, borderRadius: radius.inner,
      padding: '16px 18px', marginTop: 16,
    }}>
      <div style={{ fontSize: 13, opacity: 0.65 }}>Относительный уровень риска</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>
        {typeof primary.risk_score === 'number' ? primary.risk_score.toFixed(3) : '—'}
      </div>
      {primary.risk_band && <div style={{ marginTop: 6, fontSize: 16 }}>{primary.risk_band}</div>}
      <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, opacity: 0.75 }}>
        Это ранговый индекс, а не вероятность выгорания. Публичное объяснение
        показывает только смысловые акустические факторы; точные model coefficients,
        feature values, thresholds и numeric contributions не раскрываются.
      </div>
      <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.8 }}>
        <div><span style={{ opacity: 0.6 }}>Модель:</span> {primary.model_id ?? '—'}</div>
        <div><span style={{ opacity: 0.6 }}>Единица наблюдения:</span> {primary.validated_unit ?? '—'}</div>
        <div><span style={{ opacity: 0.6 }}>Перцентиль reference:</span> {typeof primary.reference_percentile === 'number' ? primary.reference_percentile.toFixed(1) : '—'}</div>
      </div>

      {explanation && <Case2ExplanationBlock explanation={explanation} />}
    </div>
  );
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 15, opacity: 0.7 }}>{children}</div>;
}
