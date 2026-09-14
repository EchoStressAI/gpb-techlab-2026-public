import { useEffect, useState } from 'react';
import { color, radius } from '../../theme';
import type { AsrStatus, Transcript } from '../../types';
import { getTranscript } from '../../api/calls';
import { ApiError } from '../../api/client';
import { NO_DATA, num, secondsToClock } from '../../utils/format';
import { Notice } from './UploadPanel';
import { Muted } from './RiskPanel';

/**
 * Пробел в данных и молчание участника — разные вещи, и выглядеть
 * они должны по-разному. EMPTY_ASR_WITH_SPEECH означает, что речь была,
 * а слов не извлеклось: это дефект распознавания, а не пауза.
 */
const ASR_NOTE: Record<AsrStatus, string | null> = {
  OK: null,
  EMPTY_ASR_WITH_SPEECH: 'речь есть, слов не извлеклось',
  ASR_ERROR: 'сбой распознавания',
  SKIPPED_NOT_ROUTED: 'роль не отнесена к расшифровке',
};

const ASR_COLOR: Record<AsrStatus, string> = {
  OK: color.green,
  EMPTY_ASR_WITH_SPEECH: color.amber,
  ASR_ERROR: color.red,
  SKIPPED_NOT_ROUTED: color.inkMuted,
};

const ROLE_LABEL: Record<string, string> = {
  CALLER: 'Клиент',
  SUPPORT_OPERATOR: 'Оператор',
};

export function TranscriptPanel({ jobId }: { jobId: string }) {
  const [data, setData] = useState<Transcript | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    getTranscript(jobId, ctrl.signal)
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

  if (loading) return <Muted>Загрузка расшифровки…</Muted>;
  if (error) {
    if (error instanceof ApiError && error.isForbidden) {
      return (
        <Notice tone="warning">
          Расшифровка закрыта. Нужно право <code>{error.requiredScope ?? 'transcript:read'}</code>.
        </Notice>
      );
    }
    return <Notice tone="error">{error.message}</Notice>;
  }
  if (!data) return null;
  if (data.turns.length === 0) return <Muted>Ходов в расшифровке нет.</Muted>;

  return (
    <div>
      {data.turns.map((t) => {
        const note = ASR_NOTE[t.asr_status];
        return (
          <div key={t.reply_id} style={{
            display: 'flex', gap: 14, padding: '10px 0',
            borderTop: `1px solid ${color.border}80`,
          }}>
            <div style={{ minWidth: 30, fontSize: 13, opacity: 0.45, paddingTop: 2 }}>
              {t.dialogue_turn_index}
            </div>
            <div style={{
              minWidth: 108, fontSize: 13, opacity: 0.65, paddingTop: 2,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {secondsToClock(t.start_sec)}–{secondsToClock(t.end_sec)}
            </div>
            <div style={{ minWidth: 88, fontSize: 13, fontWeight: 600, paddingTop: 2 }}>
              {ROLE_LABEL[t.speaker_role] ?? t.speaker_role}
              <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>
                канал {t.channel_index}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {/* Выводы по тексту допустимы только при semantic_text_observable. */}
              {t.semantic_text_observable && t.text ? (
                <div style={{ fontSize: 15, lineHeight: 1.6 }}>{t.text}</div>
              ) : (
                <div style={{
                  fontSize: 14, fontStyle: 'italic',
                  color: ASR_COLOR[t.asr_status],
                }}>
                  {note ?? NO_DATA}
                </div>
              )}
              <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>
                речь {num(t.speech_sec, 2)} с
                {t.gap_from_previous_sec !== null && ` · пауза до хода ${num(t.gap_from_previous_sec, 2)} с`}
                {t.overlaps_previous && ' · перекрывает предыдущий ход'}
              </div>
            </div>
          </div>
        );
      })}

      <div style={{
        marginTop: 14, background: color.chipBg, borderRadius: radius.inner,
        padding: '10px 14px', fontSize: 13, opacity: 0.8,
      }}>
        Ходы без текста — это пробел в данных, а не молчание участника.
        Строить выводы можно только по ходам с распознанным текстом.
      </div>
    </div>
  );
}
