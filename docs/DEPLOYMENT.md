# Развёртывание

## 1. Варианты запуска

Публичный integration layer можно запускать:

- напрямую через Python/uvicorn;
- через Docker;
- как часть локального docker-compose вместе с case-specific runtime;
- за корпоративным reverse proxy/API gateway.

## 2. Локальный Python

Требуется Python 3.11+.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn gpb_submission.app:app --host 0.0.0.0 --port 8080
```

Проверка:

```bash
curl http://127.0.0.1:8080/health
```

Без подключённых runtime `/health` будет работать, а `/readiness` вернёт `503`.

## 3. Docker

```bash
docker build -t echostress-gpb-submission:local .
docker run --rm -p 8080:8080 \
  -e GPB_CASE1_RUNTIME_URL=http://host.docker.internal:8101 \
  -e GPB_CASE2_RUNTIME_URL=http://host.docker.internal:8102 \
  echostress-gpb-submission:local
```

Для Linux адрес доступа к host runtime может требовать отдельной настройки сети; в production рекомендуется общая docker network и service names.

## 4. Docker Compose

В репозитории есть минимальный `docker-compose.yml`:

```bash
export GPB_CASE1_RUNTIME_URL=http://case1-runtime:8101
export GPB_CASE2_RUNTIME_URL=http://case2-runtime:8102
docker compose up --build
```

Текущий compose запускает integration API. Case runtime могут быть добавлены как дополнительные локальные services без изменения публичного API.

## 5. Runtime topology

Рекомендуемая on-prem схема:

```text
               ┌──────────────────┐
client/UI ────> │ integration API  │ :8080
               └───────┬──────────┘
                       │ local network
              ┌────────┴─────────┐
              │                  │
              v                  v
      CASE 1 runtime      CASE 2 runtime
          :8101               :8102
```

Аудио не требуется отправлять во внешний облачный сервис, если оба runtime развернуты в локальном контуре.

## 6. Readiness

После запуска обязательно проверять оба endpoint:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -i http://127.0.0.1:8080/api/v1/readiness
```

`/health = 200` означает только, что integration API жив.

`/readiness = 200` означает, что оба case runtime доступны и прошли минимальную health-проверку.

## 7. Конфигурация

Основные переменные:

```text
GPB_CASE1_RUNTIME_URL
GPB_CASE2_RUNTIME_URL
```

Не рекомендуется хранить токены/секреты в Git. Для production использовать secret manager, environment injection или инфраструктурные механизмы заказчика.

## 8. Логи

Публичный слой не должен логировать полный аудиоконтент или персональные транскрипты по умолчанию.

Рекомендуемые технические поля:

- request id;
- case id;
- model id;
- duration/latency;
- HTTP status;
- runtime availability;
- contract error type;
- безопасные quality flags.

## 9. Production hardening

Конкурсный репозиторий не является готовой enterprise perimeter-конфигурацией. Для production/on-prem дополнительно требуются:

- TLS;
- authentication/authorization;
- network policies;
- rate limiting;
- audit logging;
- secret management;
- vulnerability scanning;
- pinned image digests;
- backup/rollback policy;
- observability;
- SLA/health monitoring.

## 10. Обновление runtime

Case runtime должен обновляться независимо от integration API при сохранении контракта.

Перед обновлением:

1. сохранить предыдущий image/model id;
2. проверить `/health` runtime;
3. проверить contract tests;
4. проверить end-to-end smoke;
5. убедиться, что `model_id` изменился при содержательной замене модели;
6. только после этого переключать production traffic.

## 11. Rollback

Rollback должен быть простым: вернуть предыдущий versioned runtime image/artefact и повторить readiness/smoke. Публичный integration layer не должен требовать миграции данных при обычной замене compatible runtime.
