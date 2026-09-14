/**
 * Публичный адрес приложения и сборка URL.
 *
 * PUBLIC_ORIGIN задаётся на этапе сборки образа (VITE_PUBLIC_ORIGIN,
 * см. docker-compose.yml → build.args). Если не задан — берётся origin
 * текущей страницы, что корректно работает и на localhost, и за доменом.
 */

const configured = import.meta.env.VITE_PUBLIC_ORIGIN?.trim();

export const PUBLIC_ORIGIN: string =
  configured && configured.length > 0
    ? configured.replace(/\/+$/, '') // без хвостового слэша
    : typeof window !== 'undefined'
      ? window.location.origin
      : '';

/** Базовый путь API. Относительный — запросы идут на тот же домен через nginx. */
export const API_BASE: string = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '');

/**
 * Абсолютный URL внутри приложения — для ссылок, которые уходят наружу:
 * письма, выгрузки, «поделиться результатом».
 *
 *   absoluteUrl('/analysis/f4') → https://твой-домен/analysis/f4
 */
export function absoluteUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${PUBLIC_ORIGIN}${clean}`;
}

/** URL эндпоинта API. */
export function apiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  // API_BASE относительный ("/api") — fetch сам достроит текущий origin,
  // сохраняя basic-auth сессию браузера.
  return `${API_BASE}${clean}`;
}
