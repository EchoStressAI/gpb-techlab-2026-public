import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { health } from '../api/calls';
import { color, radius, shadow } from '../theme';

/**
 * Вход по токену.
 *
 * Контракт не содержит ручки входа: токен выдаётся вне приложения,
 * а его действительность проверяется запросом /v1/whoami. Поэтому
 * здесь поле токена, а не пара логин/пароль.
 */
export function TokenPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Доступность сервиса.
   *
   * Ручка /health не требует токена, поэтому отвечает на единственный
   * вопрос: доехал ли запрос до сервиса вообще. Без этого отказ входа
   * выглядит одинаково и при неверном токене, и при неподнятом прокси,
   * и человек ищет ошибку не там.
   */
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    health(ctrl.signal)
      .then(() => setReachable(true))
      .catch((e) => {
        if (!(e instanceof DOMException && e.name === 'AbortError')) setReachable(false);
      });
    return () => ctrl.abort();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token.trim()) {
      setError('Введите токен доступа');
      return;
    }
    setLoading(true);
    try {
      await signIn(token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: color.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 460, background: color.card,
        borderRadius: radius.card, boxShadow: shadow.card, padding: '32px 32px 28px',
      }}>
        {/* Разделителя между логотипами нет: два знака и так не
            сливаются, а черта добавляла третий элемент без смысла.
            Выравнивание по центру высоты — знаки разной пропорции,
            и по верхнему краю они смотрелись бы вразнобой. */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 24, marginBottom: 24,
        }}>
          <img src="/logo.svg" alt="EchoStressAI" style={{ height: 76, display: 'block' }} />
        </div>

        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Доступ к сервису</h1>
        <p style={{ margin: '0 0 24px', fontSize: 15, opacity: 0.7 }}>
          Анализ речевых записей
        </p>

        <form onSubmit={onSubmit} noValidate>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              Токен доступа
            </span>
            <input
              type="password"
              value={token}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Bearer-токен, выданный администратором"
              style={{
                width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                fontSize: 15, color: color.ink, padding: '11px 14px',
                borderRadius: radius.control, background: '#FFFFFF',
                border: `1px solid ${color.border}`, outline: 'none',
              }}
            />
          </label>

          {error && (
            <div style={{
              background: `${color.red}14`, color: color.red, borderRadius: radius.inner,
              padding: '10px 14px', fontSize: 14, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', border: 'none', cursor: loading ? 'default' : 'pointer',
              background: loading ? color.inkMuted : color.ink, color: '#FFFFFF',
              fontSize: 16, fontWeight: 600, padding: '12px 16px',
              borderRadius: radius.control, fontFamily: 'inherit',
            }}
          >
            {loading ? 'Проверка…' : 'Войти'}
          </button>
        </form>

        {reachable === false && (
          <div style={{
            marginTop: 16, background: `${color.red}14`, color: color.red,
            borderRadius: radius.inner, padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
          }}>
            Сервис не отвечает.
          </div>
        )}

        <div style={{
          marginTop: 20, borderRadius: radius.inner,
          padding: '12px 14px', fontSize: 13, lineHeight: 1.6,
        }}>
          {reachable === true && (
            <div style={{ marginTop: 6, opacity: 0.75 }}>Сервис отвечает.</div>
          )}
        </div>
      </div>
    </div>
  );
}
