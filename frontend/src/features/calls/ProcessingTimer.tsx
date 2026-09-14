import { useEffect, useState } from 'react';
import { color } from '../../theme';

/**
 * Время работы с текущей записью, от нуля, с десятыми долями.
 *
 * Отсчёт ведётся по часам клиента от момента отправки. Серверные
 * `started_at` и `finished_at` для этого не годятся: часы машин
 * разъезжаются, и разница легко даёт отрицательное значение или скачок
 * на секунды. Ход обработки пользователь сверяет со своими часами,
 * поэтому и считаем по ним.
 *
 * После завершения таймер замирает на итоговом времени, а не обнуляется
 * и не продолжает идти.
 */
export function ProcessingTimer({
  startedAt, stoppedAt,
}: { startedAt: number; stoppedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (stoppedAt !== null) return;
    // Десятые доли: шаг чаще их разрешения, чтобы цифра не пропускала
    // значения из-за дрожания таймеров браузера.
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, [stoppedAt]);

  const elapsedMs = Math.max(0, (stoppedAt ?? now) - startedAt);

  return (
    <span style={{
      fontFamily: 'ui-monospace, monospace',
      fontVariantNumeric: 'tabular-nums',
      fontSize: 20, fontWeight: 700,
      color: stoppedAt === null ? color.orange : color.ink,
    }}>
      {formatElapsed(elapsedMs)}
    </span>
  );
}

/** 0.0 с · 12.4 с · 3:07.2 — минуты появляются только когда нужны. */
export function formatElapsed(ms: number): string {
  const total = ms / 1000;
  if (total < 60) return `${total.toFixed(1)} с`;
  const minutes = Math.floor(total / 60);
  const seconds = total - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
}

/** Время по часам клиента с десятыми долями: 09:01:47.3 */
export function clockWithTenths(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  const tenth = Math.floor(d.getMilliseconds() / 100);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${tenth}`;
}
