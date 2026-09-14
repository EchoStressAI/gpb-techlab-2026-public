/**
 * Форматирование значений.
 *
 * Ключевое правило: null означает «не измерено». Ноль вместо него
 * показывать нельзя — это было бы измеренное нулевое значение.
 */

/** Прочерк для непроверенных значений. */
export const NO_DATA = '—';

export function num(value: number | null | undefined, digits = 2): string {
  return value === null || value === undefined ? NO_DATA : value.toFixed(digits);
}

export function int(value: number | null | undefined): string {
  return value === null || value === undefined ? NO_DATA : String(value);
}

/** Секунды → мм:сс. */
export function secondsToClock(value: number | null | undefined): string {
  if (value === null || value === undefined) return NO_DATA;
  const total = Math.round(value);
  return (
    String(Math.floor(total / 60)).padStart(2, '0') +
    ':' +
    String(total % 60).padStart(2, '0')
  );
}

export function seconds(value: number | null | undefined, digits = 2): string {
  return value === null || value === undefined ? NO_DATA : `${value.toFixed(digits)} с`;
}

/** ISO 8601 → читаемая дата и время. */
export function dateTime(iso: string | null | undefined): string {
  if (!iso) return NO_DATA;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Значение для input[type=datetime-local] из текущего момента. */
export function nowForInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * datetime-local → ISO 8601 со смещением часового пояса.
 *
 * Поле datetime-local отдаёт время без зоны: «2026-09-11T15:00». Отправлять
 * его как есть нельзя — контракт ждёт вид `2026-09-11T15:00:00+00:00`, и
 * строку без смещения сервис вправе прочитать как UTC. Для Москвы это
 * сдвиг на три часа: по call_datetime строится личная история сотрудника,
 * и порядок звонков важен, поэтому смещение проставляется явно.
 *
 * Берётся смещение на введённую дату, а не на «сейчас»: летом и зимой
 * оно может отличаться.
 */
export function inputToIso(value: string): string {
  if (!value) return value;
  const withSeconds = value.length === 16 ? `${value}:00` : value;

  const local = new Date(withSeconds);
  if (Number.isNaN(local.getTime())) return withSeconds;

  // getTimezoneOffset считает в обратную сторону: для UTC+3 вернёт -180.
  const offsetMinutes = -local.getTimezoneOffset();
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${withSeconds}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
