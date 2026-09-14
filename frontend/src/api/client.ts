/**
 * HTTP-клиент к API.
 *
 * Отвечает за префикс /v1, заголовок Authorization и разбор ошибок.
 * Коды 401 и 403 разводятся намеренно: это разные ситуации для
 * пользователя, и склеивать их в «нет доступа» нельзя.
 *
 * Запросы идут на собственный origin по пути /api. Префикс срезает
 * прокси — nginx в проде, dev-сервер Vite при разработке. Поэтому
 * адрес сервиса нигде во фронтенде не зашит, а токен не превращается
 * в cross-origin заголовок и не требует CORS.
 */

import { getToken, clearToken } from '../auth/session';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '');
const PREFIX = '/v1';

/** Ошибка API. Поля required_scope и fields приходят не всегда. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public requiredScope?: string,
    public fields?: { field: string; problem: string }[],
    public jobStatus?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** «Я не знаю, кто вы» — помогает повторный вход. */
  get isUnauthenticated() {
    return this.status === 401;
  }

  /** «Я знаю, кто вы, и вам сюда нельзя» — вход не поможет. */
  get isForbidden() {
    return this.status === 403;
  }

  /** Сети нет или прокси не достучался до сервиса. */
  get isUnreachable() {
    return this.status === 0 || this.status === 502 || this.status === 504;
  }
}

/**
 * Разбор тела ошибки. Один на оба транспорта — fetch и XHR, чтобы
 * сообщения пользователю не расходились в зависимости от того, каким
 * способом ушёл запрос.
 */
function toApiError(status: number, raw: string): ApiError {
  let detail = `Ошибка запроса (${status})`;
  let requiredScope: string | undefined;
  let fields: { field: string; problem: string }[] | undefined;
  let jobStatus: string | undefined;

  try {
    const parsed = JSON.parse(raw);
    // detail у FastAPI бывает и строкой, и списком ошибок валидации.
    if (typeof parsed?.detail === 'string') {
      detail = parsed.detail;
    } else if (Array.isArray(parsed?.detail)) {
      detail = parsed.detail
        .map((d: { loc?: unknown[]; msg?: string }) =>
          `${(d.loc ?? []).slice(1).join('.')}: ${d.msg ?? 'некорректное значение'}`)
        .join('; ');
    }
    requiredScope = parsed?.required_scope;
    fields = parsed?.fields;
    jobStatus = parsed?.status;
  } catch {
    // 502/504 от прокси приходят HTML — тело разобрать нельзя.
    if (status === 502 || status === 504) detail = 'Сервис анализа недоступен';
    if (status === 413) detail = 'Запись не принята: превышен предел размера';
  }

  // Токен истёк или неверен — сессию сбрасываем.
  // При 403 токен валиден, сбрасывать его нельзя: пользователь просто
  // не имеет нужного права, и повторный вход ничего не изменит.
  if (status === 401) clearToken();

  return new ApiError(status, detail, requiredScope, fields, jobStatus);
}

function authHeader(): string | null {
  // Схема Bearer обязательна: голый токен сервис не опознаёт.
  const token = getToken();
  return token ? `Bearer ${token}` : null;
}

interface RequestOptions {
  method?: string;
  body?: BodyInit;
  /** Не подставлять префикс /v1 (нужно для /health). */
  raw?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers = new Headers();

  const auth = authHeader();
  if (auth) headers.set('Authorization', auth);

  // Для FormData Content-Type ставит браузер — ему нужен boundary.
  if (opts.body && !(opts.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${BASE_URL}${opts.raw ? '' : PREFIX}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body,
      signal: opts.signal,
      credentials: 'same-origin',
    });
  } catch (e) {
    // Прерывание — это не отказ сервиса, его пробрасываем как есть:
    // вызывающий код сам решает, что делать с отменой.
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'Сервис недоступен: нет ответа от сети');
  }

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  throw toApiError(res.status, await res.text().catch(() => ''));
}

export interface UploadOptions {
  /** Доля отправленного, 0..1. null — браузер не сообщает объём. */
  onProgress?: (fraction: number | null) => void;
  signal?: AbortSignal;
}

/**
 * Отправка формы с показом хода загрузки.
 *
 * Здесь XHR, а не fetch, сознательно: предел записи — 512 МБ, а fetch
 * до сих пор не даёт узнать, сколько байт ушло. Без этого на полчаса
 * отправки пользователь видит неподвижную надпись и считает, что всё
 * зависло.
 */
function upload<T>(path: string, form: FormData, opts: UploadOptions = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}${PREFIX}${path}`, true);
    xhr.withCredentials = false;

    const auth = authHeader();
    if (auth) xhr.setRequestHeader('Authorization', auth);
    // Content-Type для FormData не ставим: boundary проставит браузер.

    // Загрузка большого файла плюс ожидание ответа. Ноль — без предела:
    // обрывать по таймауту то, что уже почти доехало, хуже, чем ждать.
    xhr.timeout = 0;

    xhr.upload.onprogress = (e) => {
      opts.onProgress?.(e.lengthComputable ? e.loaded / e.total : null);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve((xhr.responseText ? JSON.parse(xhr.responseText) : undefined) as T);
        } catch {
          reject(new ApiError(xhr.status, 'Ответ сервиса не разобран'));
        }
        return;
      }
      reject(toApiError(xhr.status, xhr.responseText ?? ''));
    };

    xhr.onerror = () => reject(new ApiError(0, 'Сервис недоступен: запись не отправлена'));
    xhr.onabort = () => reject(new DOMException('Отправка отменена', 'AbortError'));

    if (opts.signal) {
      if (opts.signal.aborted) {
        xhr.abort();
        return;
      }
      opts.signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(form);
  });
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  upload,
  /** Служебная ручка вне префикса /v1 и без аутентификации. */
  health: (signal?: AbortSignal) =>
    request<{ status?: string }>('/health', { raw: true, signal }),
};
