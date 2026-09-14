# Adapter к локальному `gpb-audio-risk`

## 1. Назначение

Внутренний рабочий backend EchoStressAI уже имеет асинхронный multi-case API:

```text
POST /api/v1/jobs
GET  /api/v1/jobs/{job_id}
GET  /api/v1/jobs/{job_id}/case1
GET  /api/v1/jobs/{job_id}/risk
GET  /api/v1/model-status
```

Public submission использует более маленький runtime contract:

```text
GET  /health
POST /v1/analyze
```

`gpb_submission.adapters.gpb_audio_risk` связывает эти два интерфейса **без копирования model implementation в public Git**.

## 2. Что делает adapter

Для каждого кейса запускается отдельный adapter process.

```text
Public Integration API
      │
      ├── CASE 1 adapter ──┐
      │                    │
      └── CASE 2 adapter ──┼──> private/local gpb-audio-risk API
                           │
                           └── async jobs + frozen models
```

Adapter:

1. принимает `/v1/analyze`;
2. проверяет 60/180 sec contract;
3. отправляет файл в `/api/v1/jobs` внутреннего backend;
4. опрашивает job status;
5. получает `/case1` или `/risk`;
6. формирует ограниченный public-safe response;
7. **не проксирует legacy blocks, private traceback и точные numeric coefficients**.

## 3. Почему это лучше, чем переносить model code

- public repo остаётся настоящим рабочим integration code;
- реальные модели используются без дублирования исходников;
- model weights/serving artifacts не публикуются;
- внутренний backend можно менять независимо;
- публичный API остаётся стабильным;
- audio может оставаться в локальном/on-prem контуре.

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

## 5. Требуемые права internal token

Adapter должен иметь только права, необходимые для своего сценария. Точный набор зависит от конфигурации внутреннего AccessControl, но логически требуется возможность:

- submit call;
- read job status;
- read model status;
- read case result/risk.

Transcript/audit/admin access adapter не нужен для обычного inference.

## 6. Health

Adapter `/health` проверяет не только процесс upstream, но и **наличие реального PRIMARY** через авторизованный model-status.

Для CASE 1 проверяется доступность:

```text
CASE1_INDUCTIVE_CDF_PRIMARY_V1
```

Для CASE 2:

```text
CASE2_OPEN_ACOUSTIC11_ORIENTED_V1
```

Если backend жив, но PRIMARY отсутствует, adapter сообщает:

```json
{
  "status": "unavailable",
  "case_id": "CASE_1",
  "model_id": "CASE1_INDUCTIVE_CDF_PRIMARY_V1",
  "analysis_horizon_sec": 60
}
```

Поэтому public `/readiness` не становится зелёным только из-за живого HTTP-процесса.

## 7. CASE 1 projection

Public-safe response может включать:

- `primary_score`;
- `decision_status`;
- `binary_prediction`;
- evidence/quality;
- client speech/turn coverage;
- recommendations;
- безопасный XAI summary;
- model/horizon provenance.

Не проксируются внутренние word/char raw model outputs и private implementation details.

## 8. CASE 2 projection

Public-safe response может включать:

- `risk_score`;
- relative percentile/band;
- model interpretation;
- speech/chunk quality;
- safe names of top XAI factors;
- model/horizon provenance.

Точные стандартизированные значения, коэффициенты и additive numeric contributions остаются внутри local runtime.

CASE 2 adapter также явно возвращает responsible-use marker:

```json
{
  "automated_employment_decision": false
}
```

Это state/research signal, а не механизм автоматического решения о сотруднике.

## 9. Запуск напрямую

CASE 1:

```bash
export GPB_ADAPTER_CASE_ID=CASE_1
export GPB_INTERNAL_API_URL=http://127.0.0.1:8081
export GPB_INTERNAL_API_TOKEN='...'
uvicorn gpb_submission.adapter_app:app --host 0.0.0.0 --port 8101
```

CASE 2 запускается вторым process с `CASE_2` и портом 8102.

## 10. Docker Compose

Добавлен override:

```text
docker-compose.with-adapters.yml
```

Запуск:

```bash
export GPB_INTERNAL_API_URL=http://host.docker.internal:8081
export GPB_INTERNAL_API_TOKEN='...'

docker compose \
  -f docker-compose.yml \
  -f docker-compose.with-adapters.yml \
  up --build
```

На Linux может потребоваться общая Docker network или подходящий host-gateway вместо `host.docker.internal`.

Adapter ports не обязаны публиковаться наружу: integration API обращается к ним по compose network.

## 11. Fail-closed behavior

Adapter возвращает unavailable/error, если:

- upstream недоступен;
- job failed;
- job timeout;
- primary model отсутствует;
- upstream response нарушает ожидаемый contract.

Ни один из этих режимов не превращается в fake score.

## 12. Public safety

Adapter намеренно не содержит:

- model weights;
- training code;
- private formulas;
- banking datasets;
- internal detailed XAI coefficients;
- legacy research blocks.

Он является **публичной транспортной/contract границей** между submission и существующим локальным model backend.
