# Архитектура публичного GPB submission

## 1. Цель архитектуры

Публичный репозиторий содержит воспроизводимый **integration layer** двух банковских кейсов и стабильный контракт подключения model runtime. Model implementation может поставляться отдельным локальным процессом/контейнером без публикации исследовательского и обучающего кода.

Архитектура оптимизирована под четыре свойства:

1. **on-prem ready** — inference может выполняться полностью в локальном контуре;
2. **fail-closed** — отсутствие модели не превращается в фиктивный результат;
3. **case isolation** — CASE 1 и CASE 2 могут обновляться независимо;
4. **public/private separation** — GitHub содержит проверяемую интеграцию, но не универсальное закрытое know-how EchoStressAI.

## 2. Контекстная схема

```text
┌──────────────────────────────────────────────────────────────────┐
│                         User / UI                                │
└──────────────────────────────┬───────────────────────────────────┘
                               │ upload + case_id
                               v
┌──────────────────────────────────────────────────────────────────┐
│                  Public FastAPI Integration API                  │
│                                                                  │
│  upload validation · case routing · readiness · error mapping    │
│  runtime contract validation · unified response                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │ local HTTP
                 ┌─────────────┴─────────────┐
                 │                           │
                 v                           v
┌─────────────────────────┐       ┌─────────────────────────┐
│ CASE 1 model runtime    │       │ CASE 2 model runtime    │
│ CLIENT · <= 60 sec      │       │ employee · <= 180 sec   │
│ score/quality/XAI       │       │ signal/quality/XAI      │
└─────────────────────────┘       └─────────────────────────┘
```

## 3. Слои

### 3.1. Presentation / caller

Frontend или другой клиент:

- выбирает кейс;
- загружает аудио;
- отображает status/quality/explanation;
- не должен интерпретировать transport error как model score.

### 3.2. Public integration API

Реализован в `src/gpb_submission/`.

Ответственность:

- нормализация `case_id`;
- ограничение размера upload;
- выбор runtime endpoint;
- задание фиксированного `analysis_horizon_sec`;
- проверка runtime health;
- проверка обязательных полей ответа;
- единая HTTP/error semantics;
- `/health` и `/readiness`.

Integration layer **не содержит** fallback business score.

### 3.3. CASE 1 runtime

Локальный model service для сценария внешнего психологического воздействия на клиента.

Контракт:

```text
role: CLIENT
horizon: 60 sec
```

Runtime самостоятельно реализует необходимые preprocessing/model stages и возвращает model-specific result.

### 3.4. CASE 2 runtime

Локальный model service для речевого исследовательского/операционного сигнала состояния сотрудника.

Контракт:

```text
role: employee/support operator
horizon: 180 sec
```

Runtime отвечает за model inference и quality-layer. Public integration API не принимает автоматических значимых решений о сотруднике.

## 4. Поток запроса

```text
1. POST /api/v1/analyze
2. validate case_id
3. read/upload-size check
4. resolve RuntimeTarget
5. forward audio + fixed horizon to local runtime
6. runtime inference
7. validate case/horizon/status/model_id
8. return unified response
```

## 5. Почему horizon передаётся явно

Фиксированное окно является частью model contract, а не UI-настройкой:

- CASE 1 — 60 сек;
- CASE 2 — 180 сек.

Runtime обязан физически соблюдать переданный horizon. Если ответ сообщает другой horizon, integration layer отклоняет результат.

Это снижает риск временной утечки и делает поведение модели проверяемым.

## 6. Health и readiness

Архитектура намеренно различает два состояния.

### `/health`

Integration API процесс жив.

### `/readiness`

Оба обязательных case runtime доступны и отвечают по контракту health.

Такой подход предотвращает ситуацию, когда контейнер считается «готовым», хотя реальные модели отсутствуют.

## 7. Fail-closed error model

| Ситуация | Public behavior |
|---|---|
| runtime URL не задан | `MODEL_RUNTIME_UNAVAILABLE` / HTTP 503 |
| runtime network/timeout | HTTP 503 |
| runtime 5xx | HTTP 503 |
| invalid JSON | `MODEL_RUNTIME_CONTRACT_ERROR` / HTTP 502 |
| wrong case | HTTP 502 |
| wrong horizon | HTTP 502 |
| missing status/model_id | HTTP 502 |

Ни одна из этих ситуаций не должна давать model score «по умолчанию».

## 8. Deployment topology

Рекомендуемая topology в on-prem среде:

```text
                   protected network

UI / API Gateway
       │
       v
Integration API :8080
       │
       ├──> CASE 1 runtime :8101
       │
       └──> CASE 2 runtime :8102

Runtime ports не экспонируются во внешнюю сеть.
```

## 9. Public/private boundary

### Public

- API;
- routing;
- contracts;
- Docker integration;
- health/readiness;
- synthetic tests;
- safe methodology/docs.

### Private/local runtime

Может содержать:

- owned/licensed model artifacts;
- compiled proprietary implementation;
- private preprocessing;
- private model configuration;
- model-specific integrity manifests.

### Не входит в public boundary

- реальные банковские данные;
- training notebooks;
- universal integral engine;
- закрытые fusion/personal-baseline/longitudinal rules;
- private research tables.

## 10. Model update

Runtime version можно заменить без изменения public API, если contract совместим.

При содержательной замене модели обязательно изменить `model_id` и провести:

```text
runtime smoke
→ public contract tests
→ end-to-end smoke
→ version-specific validation
```

## 11. Security boundary

Public/private separation является **архитектурным и IP-контуром**, а не обещанием криптографически защитить модель от администратора машины, на которой она запущена.

Production IP hardening, IAM, TLS, secret management и container security являются отдельным deployment concern.

## 12. Расширяемость

Архитектура допускает добавление:

- асинхронного job API;
- batch processing;
- UI progress;
- observability;
- queue/workers;
- дополнительные безопасные explanation fields;
- versioned runtime adapters.

При этом базовые case IDs и 60/180 sec contract должны оставаться стабильными либо версионироваться явно.
