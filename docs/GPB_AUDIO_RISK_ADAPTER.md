# Bridge к локальному model runtime

## 1. Назначение

Публичный submission использует компактный runtime contract:

```text
GET  /health
POST /v1/analyze
```

Локальная модельная инфраструктура EchoStressAI может иметь более богатый асинхронный job API. Adapter связывает эти два уровня **без копирования model implementation, weights или research code в public Git**.

Смысловой принцип:

```text
Public Integration API
      │
      ├── CASE 1 adapter ──┐
      │                    │
      └── CASE 2 adapter ──┼──> local EchoStressAI model backend
                           │
                           └── case-specific inference
```

Public repo не зависит от имени или структуры private source repository. Для него важен только стабильный runtime contract и корректная public-safe projection результата.

## 2. Что делает adapter

Для каждого кейса может запускаться отдельный adapter process.

Adapter:

1. принимает `/v1/analyze`;
2. проверяет 60/180 sec contract;
3. передаёт аудио локальному model backend;
4. ожидает завершения case-specific inference;
5. получает готовый case result;
6. формирует ограниченный public-safe response;
7. **не проксирует private traceback, legacy research blocks и точные model coefficients**.

## 3. Почему это лучше, чем переносить model code

- public repo остаётся настоящим рабочим integration code;
- реальные модели используются без публикации их исходников/весов;
- model backend можно обновлять независимо;
- публичный API остаётся стабильным;
- аудио может оставаться внутри локального/on-prem контура;
- implementation details backend не становятся частью внешнего contract.

## 4. Конфигурация adapter process

Обязательные переменные:

```text
GPB_ADAPTER_CASE_ID=CASE_1 | CASE_2
GPB_INTERNAL_API_URL=http://...
GPB_INTERNAL_API_TOKEN=<injected secret>
```

Опциональные:

```text
GPB_ADAPTER_REQUEST_TIMEOUT_SEC=30
GPB_ADAPTER_JOB_TIMEOUT_SEC=900
GPB_ADAPTER_POLL_INTERVAL_SEC=0.75
```

Token не хранится в Git и передаётся через environment/secret manager.

## 5. Минимальные права service token

Adapter должен получать только те права, которые необходимы для inference и чтения результата выбранного кейса.

Не требуется обычный пользовательский доступ к:

- полному audit log;
- административным функциям;
- произвольным внутренним model/debug endpoint;
- research data.

Принцип — least privilege.

## 6. Health / readiness

Adapter `/health` проверяет не просто жив ли upstream HTTP process, а готова ли соответствующая PRIMARY runtime.

Для CASE 1 ожидается готовность case-specific PRIMARY модели; для CASE 2 — готовность своего PRIMARY runtime.

Public layer при этом не обязан знать внутренние inventory keys или filesystem layout model artifacts.

Если backend жив, но model runtime не готов, adapter возвращает состояние `unavailable`, и public `/readiness` остаётся fail-closed.

## 7. CASE 1 projection

Public-safe response может включать:

- `primary_score`;
- `decision_status`;
- evidence/quality;
- client speech/turn coverage;
- recommendations;
- безопасный XAI summary;
- model/horizon provenance.

Не проксируются:

- raw outputs промежуточных текстовых моделей;
- точные внутренние коэффициенты;
- implementation-specific debug payloads;
- private feature engineering details.

## 8. CASE 2 projection

Public-safe response может включать:

- `risk_score` / relative state score;
- relative percentile/band, если предусмотрены runtime;
- model interpretation;
- speech/chunk quality;
- safe names/families of XAI factors;
- model/horizon provenance.

Точные стандартизированные значения, coefficients и полная numeric decomposition остаются внутри local runtime, если их публикация раскрывает обученные параметры.

CASE 2 adapter также должен сохранять responsible-use semantics: результат — state/research signal, а не автоматическое кадровое решение.

## 9. Запуск adapter process

CASE 1 и CASE 2 могут запускаться как два локальных adapter process с разными `GPB_ADAPTER_CASE_ID` и портами.

Пример:

```bash
export GPB_ADAPTER_CASE_ID=CASE_1
export GPB_INTERNAL_API_URL=http://127.0.0.1:8081
export GPB_INTERNAL_API_TOKEN='...'
uvicorn gpb_submission.adapter_app:app --host 0.0.0.0 --port 8101
```

Для CASE 2 используется `GPB_ADAPTER_CASE_ID=CASE_2` и другой локальный порт.

## 10. Docker Compose

Для локальной интеграции используется compose override:

```text
docker-compose.with-adapters.yml
```

Adapter ports не обязаны публиковаться наружу: integration API может обращаться к ним по внутренней Docker network.

## 11. Fail-closed behavior

Adapter возвращает unavailable/error, если:

- local backend недоступен;
- inference job failed;
- inference timeout;
- PRIMARY model/runtime не готов;
- upstream response нарушает ожидаемый contract.

Ни один из этих режимов не превращается в fake score.

## 12. Public safety

Adapter намеренно не содержит:

- model weights;
- training code;
- private formulas;
- банковские datasets;
- internal detailed XAI coefficients;
- legacy research blocks;
- internal repository topology, не требуемую для интеграции.

Он является **публичной транспортной/contract границей** между submission и локальным model runtime.

## 13. Что является публичным contract, а что implementation detail

Публичный contract:

```text
case_id
analysis horizon
health/readiness
input audio
result status
score semantics
quality/evidence
safe XAI
```

Implementation detail:

```text
private repository layout
internal endpoint decomposition
internal inventory keys
filesystem paths
model artifact names beyond public model identity
research/debug payloads
```

Такой дизайн делает public repo понятным и рабочим, не превращая его в карту внутренней инфраструктуры EchoStressAI.
