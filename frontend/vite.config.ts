import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Адрес боевого сервиса. Переопределяется переменной VITE_PROXY_TARGET
 * в .env — когда появится свой домен, менять код не нужно.
 */
const DEFAULT_TARGET = 'https://backend.example.com';

export default defineConfig(({ mode }) => {
  // Каталог '.' вместо process.cwd(): конфиг собирается tsc без типов Node.
  const env = loadEnv(mode, '.', '');
  const target = env.VITE_PROXY_TARGET || DEFAULT_TARGET;

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // чтобы dev-сервер был доступен снаружи контейнера
      port: 5173,
      watch: {
        // Надёжный watch при монтировании тома с хоста.
        usePolling: true,
      },
      /**
       * Прокси повторяет поведение nginx в проде: фронт всегда ходит
       * на свой origin по пути /api, префикс срезается здесь. Благодаря
       * этому в браузере нет cross-origin запросов и сервису не нужен CORS.
       */
      proxy: {
        '/api': {
          target,
          // Host подменяется на хост сервиса. Обязательно: имя
          // backend.example.com участвует и в TLS SNI, и в выборе
          // виртуального хоста на входе.
          changeOrigin: true,
          // Сертификат настоящий, от Let's Encrypt. Проверку не отключаем:
          // secure: false здесь означало бы «принимаю любой сертификат».
          secure: true,
          // Префикс /api НЕ срезаем: backend сам живёт под /api —
          // рабочий адрес выглядит как https://<host>/api/v1/uploads.
          // Со срезанием запрос уходил на /v1/uploads и возвращал 404.
          // rewrite: (p) => p,
          // Обработка идёт минутами, а запись может весить 512 МБ —
          // умолчания прокси обрывали бы и загрузку, и ожидание ответа.
          timeout: 0,
          proxyTimeout: 10 * 60 * 1000,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
