import { color, radius } from '../../theme';

export interface Case2PublicExplanation {
  increasing_factors: string[];
  decreasing_factors: string[];
  evidence_status?: string | null;
  quality_note?: string | null;
  next_step?: string | null;
  safety_note?: string | null;
}

export interface Case1PublicExplanation {
  summary?: string | null;
  next_step?: string | null;
  safety_note?: string | null;
}

/**
 * Parse only the semantic explanation contract that the public UI needs.
 * Exact feature ids/values, coefficients, thresholds and contribution numbers
 * are deliberately absent from this type and from rendering.
 */
export function case2PublicExplanation(value: unknown): Case2PublicExplanation | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const explanation = record.public_explanation;
  if (!explanation || typeof explanation !== 'object') return null;
  const raw = explanation as Record<string, unknown>;

  return {
    increasing_factors: strings(raw.increasing_factors),
    decreasing_factors: strings(raw.decreasing_factors),
    evidence_status: optionalString(raw.evidence_status),
    quality_note: optionalString(raw.quality_note),
    next_step: optionalString(raw.next_step),
    safety_note: optionalString(raw.safety_note),
  };
}

export function case1PublicExplanation(value: unknown): Case1PublicExplanation | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const explanation = record.public_explanation;
  if (!explanation || typeof explanation !== 'object') return null;
  const raw = explanation as Record<string, unknown>;
  return {
    summary: optionalString(raw.summary),
    next_step: optionalString(raw.next_step),
    safety_note: optionalString(raw.safety_note),
  };
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function FactorList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

export function Case2ExplanationBlock({ explanation }: { explanation: Case2PublicExplanation }) {
  return (
    <div style={{
      marginTop: 16, padding: '12px 14px',
      border: `1px solid ${color.border}`, borderRadius: radius.inner,
      background: '#FFFFFF',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>Как читать результат</div>
      <FactorList title="Факторы, повысившие относительный индекс" items={explanation.increasing_factors} />
      <FactorList title="Факторы, снизившие относительный индекс" items={explanation.decreasing_factors} />
      {explanation.quality_note && (
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7 }}>
          <b>Качество наблюдения:</b> {explanation.quality_note}
        </div>
      )}
      {explanation.next_step && (
        <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7 }}>
          <b>Следующий шаг:</b> {explanation.next_step}
        </div>
      )}
      {explanation.safety_note && (
        <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, opacity: 0.7 }}>
          {explanation.safety_note}
        </div>
      )}
    </div>
  );
}

export function Case1ExplanationBlock({ explanation }: { explanation: Case1PublicExplanation }) {
  if (!explanation.summary && !explanation.next_step && !explanation.safety_note) return null;
  return (
    <div style={{
      marginTop: 16, padding: '12px 14px',
      border: `1px solid ${color.border}`, borderRadius: radius.inner,
      background: '#FFFFFF', fontSize: 13, lineHeight: 1.7,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Интерпретация</div>
      {explanation.summary && <div>{explanation.summary}</div>}
      {explanation.next_step && <div style={{ marginTop: 8 }}><b>Следующий шаг:</b> {explanation.next_step}</div>}
      {explanation.safety_note && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>{explanation.safety_note}</div>
      )}
    </div>
  );
}
