# Operations Runbook

## 1. Назначение

Краткий runbook для запуска, проверки и диагностики публичного integration API с подключёнными case runtime.

## 2. Перед запуском

Проверить:

```text
Python/Docker доступны
GPB_CASE1_RUNTIME_URL задан
GPB_CASE2_RUNTIME_URL задан
оба runtime запущены
```

## 3. Запуск API

### Python

```bash
uvicorn gpb_submission.app:app --host 0.0.0.0 --port 8080
```

### Docker Compose

```bash
docker compose up --build -d
docker compose ps
```

## 4. Первый health check

```bash
curl -fsS http://127.0.0.1:8080/health
```

Если не 200 — проблема integration API/container.

## 5. Readiness check

```bash
curl -i http://127.0.0.1:8080/api/v1/readiness
```

### 200

Оба runtime доступны.

### 503

Как минимум один runtime отсутствует/не отвечает.

Проверить каждый отдельно:

```bash
curl -i "$GPB_CASE1_RUNTIME_URL/health"
curl -i "$GPB_CASE2_RUNTIME_URL/health"
```

## 6. E2E smoke

После readiness=200 выполнить по одному безопасному test file:

```bash
curl -X POST http://127.0.0.1:8080/api/v1/analyze \
  -F case_id=CASE_1 \
  -F file=@safe_case1_demo.wav
```

```bash
curl -X POST http://127.0.0.1:8080/api/v1/analyze \
  -F case_id=CASE_2 \
  -F file=@safe_case2_demo.wav
```

Проверить:

- правильный case;
- правильный horizon;
- model_id;
- status;
- quality;
- explanation fields;
- отсутствие private paths/errors.

## 7. Если API работает, но runtime недоступен

Порядок:

1. проверить env var;
2. проверить DNS/service name;
3. проверить runtime container/process;
4. проверить локальный port;
5. проверить network policy;
6. проверить runtime logs;
7. не менять integration API ради маскировки runtime outage.

## 8. Если contract error

Сравнить runtime response с `docs/RUNTIME_CONTRACT.md`.

Чаще всего:

- wrong `case_id`;
- wrong horizon;
- missing `model_id`;
- missing `status`;
- invalid JSON.

## 9. Restart

Integration API stateless относительно одного запроса, поэтому штатный restart обычно безопасен.

```bash
docker compose restart api
```

Если менялся image:

```bash
docker compose up -d --build
```

## 10. Rollback

Для production-like demo лучше иметь предыдущий image tag/digest.

Rollback sequence:

```text
stop new version
→ start previous version
→ /health
→ /readiness
→ E2E smoke
```

## 11. Logs

Не выводить в публичные logs:

- raw audio;
- полный transcript;
- credentials;
- private model paths;
- персональные данные.

Полезные technical fields:

```text
request_id
case_id
model_id
latency
status
quality_status
error_class
```

## 12. Demo preflight

За 10–15 минут до показа:

- [ ] containers healthy;
- [ ] readiness 200;
- [ ] CASE 1 smoke successful;
- [ ] CASE 2 smoke successful;
- [ ] browser/UI refreshed;
- [ ] safe demo files локально доступны;
- [ ] recorded fallback готов и подписан как recorded;
- [ ] commit/model IDs записаны.

## 13. Post-demo

Сохранить только безопасное technical evidence:

```text
public commit SHA
runtime model IDs
CI run
smoke timestamp
known issues
```

Не добавлять real bank audio в public issue/repo после demo.
