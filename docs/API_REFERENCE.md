# API Reference

## 1. Базовый сервис

По умолчанию примеры предполагают:

```text
http://127.0.0.1:8080
```

FastAPI автоматически предоставляет OpenAPI/Swagger UI:

```text
/docs
/openapi.json
```

## 2. `GET /health`

Показывает, что integration layer запущен. Этот endpoint **не доказывает**, что model runtime обоих кейсов доступен.

Пример:

```bash
curl http://127.0.0.1:8080/health
```

Типовой ответ:

```json
{
  "status": "ok",
  "service": "echostress-gpb-submission",
  "cases": {
    "CASE_1": {
      "analysis_horizon_sec": 60,
      "description": "..."
    },
    "CASE_2": {
      "analysis_horizon_sec": 180,
      "description": "..."
    }
  }
}
```

## 3. `GET /readiness`

Alias:

```text
GET /api/v1/readiness
```

Проверяет доступность обоих model runtime.

### HTTP 200

Возвращается только если оба runtime сообщили `status=ok`.

### HTTP 503

Хотя бы один runtime отсутствует, не настроен или недоступен.

Пример:

```bash
curl -i http://127.0.0.1:8080/api/v1/readiness
```

Ответ имеет форму:

```json
{
  "status": "ready",
  "runtimes": {
    "CASE_1": {
      "status": "ok",
      "case_id": "CASE_1",
      "configured": true,
      "analysis_horizon_sec": 60,
      "model_id": "..."
    },
    "CASE_2": {
      "status": "ok",
      "case_id": "CASE_2",
      "configured": true,
      "analysis_horizon_sec": 180,
      "model_id": "..."
    }
  }
}
```

## 4. `POST /api/v1/analyze`

Multipart endpoint анализа одного аудиофайла.

Поля:

- `file` — аудиозапись;
- `case_id` — `CASE_1` или `CASE_2`.

Пример CASE 1:

```bash
curl -X POST http://127.0.0.1:8080/api/v1/analyze \
  -F case_id=CASE_1 \
  -F file=@sample.wav
```

Пример CASE 2:

```bash
curl -X POST http://127.0.0.1:8080/api/v1/analyze \
  -F case_id=CASE_2 \
  -F file=@sample.wav
```

## 5. Успешный ответ

Integration layer оборачивает ответ runtime:

```json
{
  "case_id": "CASE_1",
  "source_filename": "sample.wav",
  "analysis_horizon_sec": 60,
  "result": {
    "case_id": "CASE_1",
    "model_id": "runtime-model-id",
    "analysis_horizon_sec": 60,
    "status": "ok"
  }
}
```

Case-specific поля внутри `result` определяются runtime-контрактом.

## 6. Ошибки клиента

### 400 — invalid case

Если `case_id` не соответствует поддерживаемому значению.

### 400 — empty upload

Пустой файл.

### 413 — file too large

Публичный integration layer ограничивает размер upload **200 MiB**.

## 7. Ошибки runtime

### 503 — `MODEL_RUNTIME_UNAVAILABLE`

Runtime не настроен или недоступен.

Пример semantic detail:

```json
{
  "detail": {
    "status": "MODEL_RUNTIME_UNAVAILABLE",
    "case_id": "CASE_1",
    "detail": "..."
  }
}
```

### 502 — `MODEL_RUNTIME_CONTRACT_ERROR`

Runtime ответил, но нарушил публичный контракт.

Причины могут включать:

- неверный `case_id`;
- неверный `analysis_horizon_sec`;
- отсутствие `status`;
- отсутствие `model_id`;
- не-JSON ответ.

## 8. Контракт downstream runtime

Integration layer отправляет в runtime:

```text
POST {runtime_url}/v1/analyze
```

multipart:

- `file`;
- `analysis_horizon_sec`.

Runtime также должен поддерживать:

```text
GET {runtime_url}/health
```

Подробности: [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md).

## 9. Переменные окружения

Текущая HTTP-runtime схема использует:

```text
GPB_CASE1_RUNTIME_URL
GPB_CASE2_RUNTIME_URL
```

URL должен указывать на локально доступный runtime service.

## 10. Безопасность API

Этот конкурсный public integration layer не реализует production IAM, rate limiting, audit logging или enterprise authentication. При реальном on-prem внедрении эти функции должны добавляться на инфраструктурном/API gateway уровне в соответствии с политиками заказчика.
