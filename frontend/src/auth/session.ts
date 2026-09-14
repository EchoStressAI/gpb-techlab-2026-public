/**
 * Хранение Bearer-токена.
 *
 * ВНИМАНИЕ, открытый вопрос из контракта (пункт «Токен в браузере»):
 * сейчас токен лежит в localStorage. Это работает, но означает, что
 * токен доступен из JS и уязвим к XSS. Альтернатива — сессия, которую
 * держит обратный прокси; тогда этот модуль не нужен вовсе, а клиент
 * перестаёт слать заголовок Authorization.
 */

const TOKEN_KEY = 'echostress.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
