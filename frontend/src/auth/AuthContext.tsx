import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Scope, WhoAmI } from '../types';
import { whoami } from '../api/calls';
import { ApiError } from '../api/client';
import { getToken, saveToken, clearToken } from './session';

interface AuthState {
  user: WhoAmI | null;
  ready: boolean;
  isAuthenticated: boolean;
  /** Есть ли право. Интерфейс строится по правам, а не по кодам ответов. */
  can: (scope: Scope) => boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WhoAmI | null>(null);
  // ready отделяет «ещё проверяем токен» от «токена нет»: без этого
  // при перезагрузке страницы на миг показывалась бы форма входа.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    // Токен проверяется единственным способом — запросом whoami.
    whoami()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (token: string) => {
    saveToken(token);
    try {
      setUser(await whoami());
    } catch (e) {
      clearToken();
      if (e instanceof ApiError && e.isUnauthenticated) {
        throw new Error('Токен не распознан сервисом');
      }
      throw e;
    }
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      isAuthenticated: user !== null,
      can: (scope) => user?.scopes.includes(scope) ?? false,
      signIn,
      signOut,
    }),
    [user, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return ctx;
}
