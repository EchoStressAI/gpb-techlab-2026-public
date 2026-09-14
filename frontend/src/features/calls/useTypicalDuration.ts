import { useEffect, useState } from 'react';
import { getUploads } from '../../api/calls';
import type { CaseId, UploadRecord } from '../../types';

/**
 * Типичная длительность обработки для сценария, в миллисекундах.
 *
 * Сервис не сообщает ни общего числа задач, ни оставшегося времени, так
 * что вычислить долю выполненного нечем. Единственная честная опора —
 * то, сколько обработка занимала раньше: берём завершённые записи того
 * же сценария из истории и считаем медиану `finished_at - started_at`.
 *
 * Медиана, а не среднее: одна запись, застрявшая на полчаса, не должна
 * растягивать оценку для всех остальных.
 *
 * null означает «не знаю» — и в этом случае полосу нужно показывать
 * бегущей, без процентов: выдуманное число хуже отсутствия числа.
 * Кейсы считаются раздельно намеренно: первый разбирает 60 секунд
 * сигнала, второй 180, и общая оценка врала бы обоим.
 */
export function useTypicalDuration(caseId: CaseId): number | null {
  const [byCase, setByCase] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const ac = new AbortController();
    getUploads({ limit: 500 }, ac.signal)
      .then((list) => setByCase(medians(list)))
      .catch(() => {
        // История недоступна — оценки просто не будет.
      });
    return () => ac.abort();
  }, []);

  return byCase[caseId] ?? null;
}

/** Медиана длительности по каждому сценарию. */
function medians(list: UploadRecord[]): Record<string, number | null> {
  const buckets: Record<string, number[]> = {};

  list.forEach((r) => {
    if (r.status !== 'done') return;
    const ms = duration(r);
    // Отсеиваем неправдоподобное: нулевые и многочасовые значения
    // означают сбой отметок времени, а не реальную длительность.
    if (ms === null || ms < 1000 || ms > 2 * 60 * 60 * 1000) return;
    const key = String(r.case_id ?? 'UNKNOWN');
    (buckets[key] ??= []).push(ms);
  });

  const out: Record<string, number | null> = {};
  Object.entries(buckets).forEach(([key, values]) => {
    // Меньше трёх наблюдений — это не статистика, а совпадение.
    if (values.length < 3) {
      out[key] = null;
      return;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    out[key] = sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  });
  return out;
}

/** Длительность одной записи по отметкам сервиса. */
function duration(r: UploadRecord): number | null {
  const started = r.started_at ? Date.parse(r.started_at) : NaN;
  const finished = r.finished_at ? Date.parse(r.finished_at) : NaN;
  if (!Number.isFinite(started) || !Number.isFinite(finished)) return null;
  const ms = finished - started;
  return ms > 0 ? ms : null;
}
