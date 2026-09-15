import { useEffect, useState } from 'react';
import { color, radius, shadow } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { dateTime } from '../../utils/format';
import { getCase1, getRisk, getTranscript } from '../../api/calls';
import { CASE1_DECISION_LABEL, caseInfo } from '../../types';
import type { Case1Response, RiskResponse, Transcript } from '../../types';
import type { JobRow } from './useJobs';
import { Notice } from './UploadPanel';

/**
 * Public-safe detail view.
 *
 * Показывает только продуктовый PRIMARY, достаточность/качество данных,
 * безопасную семантическую интерпретацию и расшифровку при наличии права.
 * Низкоуровневые feature names, numeric contributions, thresholds,
 * imputation details и research-only слои намеренно не визуализируются.
 */
export function CallDetail({ job, onBack }: { job: JobRow; onBack: () => void }) {
  const { can } = useAuth();
  const caseId = detectCase(job) ?? 'CASE_2';
  const info = caseInfo(caseId);
  const windowLabel = caseId === 'CASE_1' ? '0–60 сек' : '0–180 сек';

  const [case1, setCase1] = useState<Case1Response | null>(null);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    const quiet = () => undefined;

    if (can('risk:read')) {
      if (caseId === 'CASE_1') {
        getCase1(job.job_id, ac.signal).then(setCase1).catch((e) => {
          if (!(e instanceof DOMException)) setError(e instanceof Error ? e.message : 'Не удалось получить результат');
        });
      } else {
        getRisk(job.job_id, ac.signal).then(setRisk).catch((e) => {
          if (!(e instanceof DOMException)) setError(e instanceof Error ? e.message : 'Не удалось получить результат');
        });
      }
    }

    if (can('transcript:read')) {
      getTranscript(job.job_id, ac.signal).then(setTranscript).catch(quiet);
    }

    return () => ac.abort();
  }, [job.job_id, caseId, can]);

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px 0' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          border: 'none', background: 'transparent', color: color.orange,
          font: 'inherit', fontSize: 16, cursor: 'pointer', padding: 0, marginBottom: 16,
        }}
      >
        ← К списку записей
      </button>

      {error && <Notice tone="error">{error}</Notice>}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{job.filename}</div>
            <div style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>
              {job.operator_id && job.operator_id !== '—' ? `Сотрудник ${job.operator_id}` : 'Идентификатор сотрудника не указан'}
              {job.submitted_at ? ` · загружено ${dateTime(job.submitted_at)}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>{info.title}</div>
            <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>окно анализа {windowLabel}</div>
          </div>
        </div>
      </Card>

      <PrimaryCard caseId={caseId} case1={case1} risk={risk} windowLabel={windowLabel} />

      <Card>
        <h2 style={{ margin: 0, fontSize: 18 }}>Как читать результат</h2>
        <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, opacity: 0.82 }}>
          Числовой score — модельный ранговый сигнал, а не вероятность и не диагноз.
          Он читается только вместе со статусом достаточности данных, временным окном
          и словесной интерпретацией. Внутренние коэффициенты, точные признаки,
          параметры нормализации и research-only outputs в публичном интерфейсе не показываются.
        </div>
      </Card>

      {transcript && transcript.turns.length > 0 && (
        <Card>
          <h2 style={{ margin: 0, fontSize: 18 }}>Расшифровка</h2>
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {transcript.turns.map((turn) => (
              <div key={`${turn.reply_id}-${turn.dialogue_turn_index}`} style={{
                padding: '10px 12px', borderRadius: radius.inner,
                background: color.chipBg, fontSize: 14, lineHeight: 1.6,
              }}>
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>
                  {turn.speaker_role} · {turn.start_sec.toFixed(1)}–{turn.end_sec.toFixed(1)} сек
                </div>
                <div>{turn.semantic_text_observable && turn.text ? turn.text : 'Текст недоступен для смыслового анализа'}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function PrimaryCard({
  caseId, case1, risk, windowLabel,
}: {
  caseId: 'CASE_1' | 'CASE_2';
  case1: Case1Response | null;
  risk: RiskResponse | null;
  windowLabel: string;
}) {
  if (caseId === 'CASE_1') {
    const primary = case1?.primary ?? null;
    if (!primary) return <Unavailable windowLabel={windowLabel} text="Основной результат ещё не получен" />;
    if (primary.status !== 'OK') return <Unavailable windowLabel={windowLabel} text={`Основная модель недоступна: ${primary.status}`} />;

    const decision = primary.decision_status ?? '';
    const abstain = decision === 'INSUFFICIENT_EVIDENCE';
    return (
      <Card>
        <Kicker>PRIMARY · {windowLabel}</Kicker>
        <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>
          {CASE1_DECISION_LABEL[decision] ?? decision ?? 'Вердикт не указан'}
        </div>
        {typeof primary.primary_score === 'number' && !abstain && (
          <div style={{ marginTop: 10, fontSize: 30, fontWeight: 700 }}>{primary.primary_score.toFixed(3)}</div>
        )}
        <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, opacity: 0.8 }}>
          {abstain
            ? 'Данных в раннем окне недостаточно для вывода. Это не низкий риск и не ноль.'
            : 'Ранговая величина относительно эталонного распределения; не вероятность воздействия.'}
        </div>
        <Rows rows={[
          ['Модель', primary.model_id ?? '—'],
          ['Достаточность данных', primary.evidence_status ?? '—'],
          ['Решение', decision || '—'],
        ]} />
      </Card>
    );
  }

  const primary = risk?.primary ?? null;
  if (!primary) return <Unavailable windowLabel={windowLabel} text="Основной результат ещё не получен" />;
  if (primary.status !== 'OK') return <Unavailable windowLabel={windowLabel} text={`Основная модель недоступна или данных недостаточно: ${primary.status}`} />;

  return (
    <Card>
      <Kicker>PRIMARY · {windowLabel}</Kicker>
      <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>
        {primary.risk_band ?? 'Относительный уровень не указан'}
      </div>
      {typeof primary.risk_score === 'number' && (
        <div style={{ marginTop: 10, fontSize: 30, fontWeight: 700 }}>{primary.risk_score.toFixed(3)}</div>
      )}
      <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, opacity: 0.8 }}>
        Это относительный модельный индекс, а не вероятность выгорания. Проверенная
        единица интерпретации — период/динамика сотрудника, а не отдельный разговор.
      </div>
      <Rows rows={[
        ['Модель', primary.model_id ?? '—'],
        ['Единица наблюдения', primary.validated_unit ?? '—'],
        ['Перцентиль относительно reference', typeof primary.reference_percentile === 'number' ? primary.reference_percentile.toFixed(1) : '—'],
      ]} />
    </Card>
  );
}

function Unavailable({ windowLabel, text }: { windowLabel: string; text: string }) {
  return (
    <Card>
      <Kicker>PRIMARY · {windowLabel}</Kicker>
      <Notice tone="warning">{text}</Notice>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: color.card, borderRadius: radius.card, boxShadow: shadow.card,
      padding: '20px 24px', marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.55, textTransform: 'uppercase' }}>{children}</div>;
}

function Rows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div style={{ marginTop: 14, display: 'grid', gap: 7, fontSize: 13 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 12 }}>
          <span style={{ opacity: 0.6 }}>{label}</span>
          <span>{value}</span>
        </div>
      ))}
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
