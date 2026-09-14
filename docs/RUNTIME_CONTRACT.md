# Model runtime contract

Публичный интеграционный слой подключает CASE 1 и CASE 2 через одинаковый локальный HTTP-контракт.

## Health

`GET /health`

Пример ответа:

```json
{
  "status": "ok",
  "case_id": "CASE_1",
  "model_id": "case1-runtime-v1"
}
```

Обязательные поля:

- `status` — `ok` для готового runtime;
- `case_id` — строго `CASE_1` или `CASE_2`;
- `model_id` — идентификатор serving-модели/сборки.

## Analyze

`POST /v1/analyze`

`multipart/form-data`:

- `file` — аудиозапись;
- `analysis_horizon_sec` — окно, которое интеграционный слой требует физически соблюдать.

Ожидаемое значение:

- CASE 1: `60`;
- CASE 2: `180`.

Пример ответа:

```json
{
  "status": "OK",
  "case_id": "CASE_1",
  "model_id": "case1-runtime-v1",
  "analysis_horizon_sec": 60,
  "score": 0.42,
  "score_type": "index",
  "decision": "REVIEW_REQUIRED",
  "quality": {
    "status": "OK"
  },
  "xai": {
    "summary": "Model-specific explanation"
  }
}
```

Минимально обязательны:

- `status`;
- `case_id`;
- `model_id`;
- `analysis_horizon_sec`.

`score`, `decision`, `quality`, `xai` могут отличаться по кейсам, но их смысл должен быть явно описан самим runtime.

## Граница ответственности

Публичный интеграционный слой:

- выбирает кейс;
- задаёт фиксированное аналитическое окно;
- проверяет доступность runtime;
- проверяет case/horizon в ответе;
- возвращает результат без изменения его модельной семантики.

Model runtime:

- декодирует/подготавливает аудио;
- физически ограничивает анализ переданным horizon;
- выполняет inference;
- возвращает score/decision/XAI/quality;
- не должен требовать доступ к публичному GitHub для обработки одного звонка.
