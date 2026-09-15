# EchoStressAI · GPB TechLab 2026

[![CI](https://github.com/EchoStressAI/gpb-techlab-2026-public/actions/workflows/ci.yml/badge.svg)](https://github.com/EchoStressAI/gpb-techlab-2026-public/actions/workflows/ci.yml)

Публичный репозиторий конкурсного решения **EchoStressAI** для двух кейсов Банка ГПБ (АО) в программе «Техлаб Москва 2026».

Решение построено как **public integration/UI layer + подключаемые локальные case-specific model runtime**. Public Git содержит проверяемый API, frontend, Docker/CI, contracts, tests и документацию; банковские данные, model weights и proprietary core EchoStressAI здесь не публикуются.

> Ключевой принцип: если реальный model runtime недоступен или нарушает contract, система работает **fail-closed** и не генерирует фиктивный score.

## Для жюри: маршрут на 5–10 минут

1. [Reviewer Guide](docs/REVIEWER_GUIDE.md) — что смотреть в первую очередь.
2. [Public Validation Results](docs/PUBLIC_VALIDATION_RESULTS.md) — текущие aggregate metrics и ограничения.
3. [Model Semantics](docs/MODEL_SEMANTICS.md) — что фактически анализирует ML без раскрытия proprietary formulas.
4. [CASE 1 Model Card](docs/CASE1_MODEL_CARD.md) и [CASE 2 Model Card](docs/CASE2_MODEL_CARD.md).
5. [GPB TZ Compliance](docs/GPB_TZ_COMPLIANCE.md) — соответствие требованиям и оставшиеся release-level evidence.
6. [Public Claims Register](docs/PUBLIC_CLAIMS_REGISTER.md) — какие формулировки подтверждены, а какие использовать нельзя.
7. [Submission Manifest](docs/SUBMISSION_MANIFEST.md) — граница public/private и состав поставки.

Полный индекс: **[docs/README.md](docs/README.md)**.

## Два банковских сценария

| | CASE 1 | CASE 2 |
|---|---|---|
| Задача | дополнительный ранний сигнал риска внешнего воздействия на клиента | ранний речевой сигнал неблагоприятного профессионального состояния сотрудника |
| Анализируемая сторона | клиент | сотрудник поддержки |
| Аналитический горизонт | первые **60 сек** | первые **180 сек** |
| Основная семантика | client-side ranking + evidence sufficiency | relative employee-period/state risk signal |
| Использование | decision support для antifraud-процесса | human-in-the-loop monitoring / wellbeing-risk support |

Система не ставит медицинских диагнозов и не предназначена для автономных кадровых, дисциплинарных, юридических или иных значимых решений о человеке.

## Текущие публичные validation results

### CASE 1 · bank-safe CLIENT-only PRIMARY

```text
PR AUC       0.3654
ROC AUC      0.7569
Weighted F1  0.8190
```

Сильный operator-side результат исследовался отдельно, но не используется как финальный client-state claim из-за workflow-shortcut риска. При недостатке клиентской речи система должна возвращать отдельный `INSUFFICIENT_EVIDENCE`, а не превращать отсутствие наблюдения в «низкий риск».

### CASE 2 · employee-period Acoustic11 snapshot

```text
Period ROC AUC          0.8701
Period PR AUC           0.8060
Operator-equal ROC AUC  ~0.882
```

Это **current competition/internal validation result**, а не завершённая внешняя популяционная validation. Within-person transition quality заметно слабее, поэтому один звонок не интерпретируется как доказательство изменения выгорания.

Подробности, единицы наблюдения и caveats: [docs/PUBLIC_VALIDATION_RESULTS.md](docs/PUBLIC_VALIDATION_RESULTS.md) и [docs/MODEL_SELECTION_AUDIT.md](docs/MODEL_SELECTION_AUDIT.md).

Важно:

- score в обоих кейсах не следует называть calibrated probability без отдельной calibration;
- CONTROL без доступной ground truth не используется для AUC claim;
- критерий понятности объяснений **≥80%** требует отдельного human-acceptance protocol и не считается автоматически выполненным только из-за наличия XAI/UI.

## Архитектура

```text
Frontend
   ↓
Public Integration API
   ↓
case routing + contract validation
   ↓
┌──────────────────┬──────────────────┐
│ CASE 1 runtime   │ CASE 2 runtime   │
│ horizon: 60 sec  │ horizon: 180 sec │
└──────────────────┴──────────────────┘
   ↓
PRIMARY result + quality/evidence + public-safe interpretation
```

Подробнее: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) и [docs/RUNTIME_CONTRACT.md](docs/RUNTIME_CONTRACT.md).

## Что можно проверить в public repo

- FastAPI integration layer и OpenAPI contract;
- routing CASE 1 / CASE 2;
- fixed 60/180-sec horizon checks;
- readiness/fail-closed behavior;
- React/TypeScript frontend;
- Docker build / compose configuration;
- synthetic contract tests;
- public hygiene checks;
- Model Cards, methodology, validation protocol и aggregate results;
- public/private IP boundary;
- deployment/on-prem documentation.

Реальный ML inference требует подключённого versioned runtime. Отсутствие weights в public Git не означает использование сохранённых результатов вместо inference.

## Что намеренно не публикуется

Public Git не содержит:

- реальные банковские аудио/транскрипты и персональные данные;
- training datasets и research notebooks;
- private model weights/checkpoints;
- exact proprietary feature tables, coefficients, scaler/imputer parameters и thresholds;
- внутреннюю формулу тревожности;
- универсальную integral/fusion/personal-baseline methodology EchoStressAI;
- production credentials и секреты.

Граница подробно описана в [docs/IP_AND_PUBLIC_BOUNDARY.md](docs/IP_AND_PUBLIC_BOUNDARY.md), [docs/PUBLIC_REPOSITORY_POLICY.md](docs/PUBLIC_REPOSITORY_POLICY.md) и [SECURITY.md](SECURITY.md).

## Быстрый запуск public API

Требуется Python 3.11+.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn gpb_submission.app:app --host 0.0.0.0 --port 8080
```

Проверка:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -i http://127.0.0.1:8080/api/v1/readiness
```

Swagger/OpenAPI:

```text
http://127.0.0.1:8080/docs
http://127.0.0.1:8080/openapi.json
```

Docker:

```bash
docker compose up --build
```

## Подключение model runtime

Integration API использует локальные HTTP runtime:

```bash
export GPB_CASE1_RUNTIME_URL=http://127.0.0.1:8101
export GPB_CASE2_RUNTIME_URL=http://127.0.0.1:8102
```

Минимальный runtime contract:

```text
GET  /health
POST /v1/analyze
```

Public gateway проверяет `case_id`, horizon, `status` и `model_id`. Ошибка upstream contract не превращается в модельное решение.

## Frontend

`frontend/` содержит пользовательский интерфейс загрузки и просмотра результатов. Публичная версия намеренно показывает только **public-safe projection**: PRIMARY, model identity, score/status semantics и доступную quality/evidence-информацию. Exact internal feature values, numeric model contributions, thresholds, imputation details и research-only outputs в public UI не раскрываются.

Подробнее: [frontend/README.md](frontend/README.md) и [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md).

## Health ≠ Readiness ≠ ML validation

- `/health` — integration API жив.
- `/readiness` — необходимые runtime доступны.
- зелёный CI — software contract/build прошёл проверки.
- PR AUC / ROC AUC — отдельное version-specific model evidence.
- понятность объяснений для HR — отдельное human evidence.

Эти уровни не подменяют друг друга. См. [docs/VALIDATION_EVIDENCE_INDEX.md](docs/VALIDATION_EVIDENCE_INDEX.md).

## Соответствие ТЗ и ещё не закрытые release evidence

ТЗ отдельно требует UI, batch/postprocessing, Docker, on-prem, работу в ранних окнах, model quality и объяснимость. Public code/documentation закрывают значительную часть проверяемого software scope, но для финального release отдельно должны быть зафиксированы:

- connected-runtime manifest и model IDs;
- end-to-end smoke на frozen runtime;
- measured resource/latency benchmark в согласованном **1×A100** ceiling;
- human explainability acceptance для критерия ≥80%;
- release/container identities и hashes.

Это перечислено в [docs/GPB_TZ_COMPLIANCE.md](docs/GPB_TZ_COMPLIANCE.md) и [docs/TECHNICAL_ACCEPTANCE_EVIDENCE.md](docs/TECHNICAL_ACCEPTANCE_EVIDENCE.md).

## Научная и экспертная прозрачность

Проект разделяет:

```text
model signal
≠ quality/evidence
≠ psychological interpretation
≠ business decision
```

Публично описаны shortcut/leakage audit, expert disagreement, temporal-window mismatch, acoustic feature families и ограничения переносимости. Научные источники не подменяют task-specific validation конкретной model version.

См. [docs/SCIENTIFIC_BACKGROUND.md](docs/SCIENTIFIC_BACKGROUND.md), [docs/SCIENTIFIC_REFERENCES.md](docs/SCIENTIFIC_REFERENCES.md), [docs/EXPERT_REVIEW_AND_VALIDATION.md](docs/EXPERT_REVIEW_AND_VALIDATION.md).

## Статус конкурсной поставки

Public repo уже содержит рабочий integration/frontend contour, reference runtime adapters, CI, Docker и evaluator-facing documentation. Следующий шаг перед freeze конкретного evaluator snapshot — связать один неизменяемый public commit с конкретными runtime/model/container identities и фактическими release evidence.

Правила versioning: [docs/PUBLIC_RELEASE_VERSIONING.md](docs/PUBLIC_RELEASE_VERSIONING.md).

## EchoStressAI

Проект: **EchoStressAI**  
Submission: **GPB TechLab 2026**  
Принцип: **explainable · fail-closed · on-prem-ready · human-in-the-loop**
