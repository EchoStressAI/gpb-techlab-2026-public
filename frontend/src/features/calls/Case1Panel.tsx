import { useEffect, useState } from 'react';
import { color, radius } from '../../theme';
import { getCase1 } from '../../api/calls';
import { ApiError } from '../../api/client';
import { CASE1_DECISION_LABEL } from '../../types';
import type { Case1Response } from '../../types';
import { Notice } from './UploadPanel';
import { Case1ExplanationBlock, case1PublicExplanation } from './PublicExplanation';

/**
 * Public-safe CASE 1 panel.
 *
 * Публичный экран показывает PRIMARY decision, ранговый score, evidence
 * sufficiency и безопасную интерпретацию/следующий шаг. Exact internal state
 * dimensions, research-only influence layer, missing feature names,
 * diagnostic-domain internals and QDS are intentionally not visualized here.
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
  if (error instanceof ApiError && error.isForbidden) {
    return <Notice tone="warning">Просмотр результата закрыт: требуется право {error.requiredScope ?? 'risk:read'}.</Notice>;
  }
  if (error) return <Notice tone="error">Не удалось получить данные CASE 1.</Notice>;

  const primary = data?.primary ?? null;
  if (!primary) return <Notice tone="info">Основной результат не получен.</Notice>;
  if (primary.status !== 'OK') {
    return <Notice tone="warning">Основная модель недоступна: {primary.status}.</Notice>;
  }

  const decision = primary.decision_status ?? '';
  const abstain = decision === 'INSUFFICIENT_EVIDENCE';
  const explanation = case1PublicExplanation(primary);

  return (
    <div style={{
      border: `1px solid ${color.border}`, borderRadius: radius.inner,
      padding: '16px 18px', marginTop: 16,
    }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>
        {CASE1_DECISION_LABEL[decision] ?? decision ?? 'Вердикт не указан'}
      </div>

      {!abstain && typeof primary.primary_score === 'number' && (
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>
          {primary.primary_score.toFixed(3)}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, opacity: 0.75 }}>
        {abstain
          ? 'Данных в первых 60 секундах недостаточно для вывода; это не низкий риск.'
          : 'Score — ранговый модельный сигнал относительно reference, а не вероятность воздействия.'}
      </div>

      <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.8 }}>
        <div><span style={{ opacity: 0.6 }}>Модель:</span> {primary.model_id ?? '—'}</div>
        <div><span style={{ opacity: 0.6 }}>Достаточность данных:</span> {primary.evidence_status ?? '—'}</div>
        <div><span style={{ opacity: 0.6 }}>Решение:</span> {decision || '—'}</div>
      </div>

      {explanation && <Case1ExplanationBlock explanation={explanation} />}

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.65, lineHeight: 1.6 }}>
        Внутренние feature values, формула тревожности, research-only layers и
        точные model internals в публичном интерфейсе не раскрываются.
      </div>
    </div>
  );
}
