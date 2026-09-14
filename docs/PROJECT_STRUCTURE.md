# Структура репозитория

## Верхний уровень

```text
.
├── README.md
├── SECURITY.md
├── CONTRIBUTING.md
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   └── gpb_submission/
├── tests/
└── docs/
```

## `src/gpb_submission/`

### `app.py`

HTTP integration layer:

- `/health`;
- `/readiness`;
- `/api/v1/readiness`;
- `/api/v1/analyze`;
- upload validation;
- mapping runtime errors to public HTTP semantics.

### `contracts.py`

Case-level public contract:

- canonical case IDs;
- horizons 60/180 sec;
- normalization of input case names;
- public descriptions.

### `runtime.py`

HTTP gateway to local model runtime:

- runtime target resolution;
- health check;
- upload forwarding;
- response validation;
- fail-closed unavailable/contract-error behavior.

### `__init__.py`

Package identity/version.

## `tests/`

Public tests verify integration behavior using synthetic/stubbed conditions. They intentionally do not require real bank data or private model weights.

## `docs/`

Documentation is split by reader goal rather than one giant document:

```text
README.md                       navigation
PROJECT_OVERVIEW.md             product overview
ARCHITECTURE.md                 architecture
METHODOLOGY.md                  high-level methodology
SCIENTIFIC_BACKGROUND.md        scientific context
CASE1_MODEL_CARD.md             CASE 1 model card
CASE2_MODEL_CARD.md             CASE 2 model card
EXPERT_REVIEW_AND_VALIDATION.md expert review methodology
VALIDATION_PROTOCOL.md          metrics/protocol rules
EXPLAINABILITY.md               XAI/quality interpretation
API_REFERENCE.md                HTTP API
RUNTIME_CONTRACT.md             downstream runtime contract
DEPLOYMENT.md                   deployment
SYSTEM_REQUIREMENTS.md          infrastructure
COMPONENTS.md                   dependencies/components
REPRODUCIBILITY.md              reproducibility boundary
DATA_PRIVACY_SECURITY.md        data/security
LIMITATIONS_AND_RESPONSIBLE_USE.md responsible use
DEMO_GUIDE.md                   demo flow
ACCEPTANCE_CHECKLIST.md         release/demo checklist
TROUBLESHOOTING.md              operations
FAQ.md                          FAQ
GLOSSARY.md                     terms
ROADMAP.md                      public roadmap
PUBLIC_REPOSITORY_POLICY.md     allow-list publication policy
```

## Public/private boundary

В этом repository **нет каталога с полным proprietary core**. Это намеренное архитектурное решение.

Case runtime подключается как отдельный process/container:

```text
public integration repo
       |
       | HTTP contract
       v
private/local runtime
```

Такой подход позволяет публично проверять API, routing, errors и deployment независимо от раскрытия training/research implementation.

## Где добавлять новый public code

Если новый код относится к:

- HTTP/API → `src/gpb_submission/`;
- integration tests → `tests/`;
- документации → `docs/`;
- CI → `.github/workflows/`;
- deployment integration → Docker/compose или отдельный public deploy path.

Если код содержит model implementation, закрытые weights, internal research feature engineering или bank-specific confidential material, по умолчанию **не добавлять** его в public repo.

## Когда менять contract

Contract change требует отдельного внимания, если меняются:

- case IDs;
- 60/180 sec horizons;
- runtime endpoint path;
- обязательные поля response;
- error status semantics;
- public API path.

Такие изменения должны сопровождаться тестами и обновлением docs.
