# Requirements Traceability Matrix

Этот документ сопоставляет ключевые требования конкурсного задания с архитектурой решения и показывает, **где именно находится реализация или подтверждение**. Матрица предназначена для навигации и не подменяет version-specific acceptance report.

Важно: отсутствие model weights/runtime source в public Git **не означает, что компонент не реализован**. Для каждого требования ниже разделены публичный код, подключаемый runtime, frontend, validation evidence и deployment evidence.

## Обозначения

- **PUBLIC REPO** — код/контракт/документация находятся в этом публичном репозитории.
- **CONNECTED RUNTIME** — реализовано в подключаемом case-specific runtime; исходники/weights могут поставляться отдельно и не публиковаться.
- **FRONTEND** — реализовано пользовательским интерфейсом в `frontend/`.
- **VALIDATION EVIDENCE** — подтверждается protocol/report конкретной model version.
- **DEPLOYMENT EVIDENCE** — подтверждается smoke/acceptance на собранной on-prem версии.
- **VERSION-SPECIFIC** — зависит от конкретной serving/release версии и не должно объявляться свойством всего репозитория автоматически.

Эти метки описывают **место реализации/подтверждения**, а не шкалу «сделано / не сделано».

## Функциональные требования

| Требование | Где реализовано | Как проверяется |
|---|---|---|
| CASE 1: анализ риска внешнего воздействия на клиента | CONNECTED RUNTIME + PUBLIC REPO gateway + FRONTEND | Model Card + connected runtime smoke + UI + validation evidence |
| Решение CASE 1 в первых 60 сек | PUBLIC REPO contract + CONNECTED RUNTIME | frozen 60-sec horizon + E2E smoke |
| CASE 2: анализ состояния сотрудника | CONNECTED RUNTIME + PUBLIC REPO gateway + FRONTEND | Model Card + connected runtime smoke + UI + validation evidence |
| Решение CASE 2 в первых 180 сек | PUBLIC REPO contract + CONNECTED RUNTIME | frozen 180-sec horizon + E2E smoke |
| Импорт файла для постобработки | PUBLIC REPO API + FRONTEND | upload/API smoke + UI demo |
| Batch/MVP processing | CONNECTED RUNTIME / release integration | version-specific acceptance |
| Отображение результата в интерфейсе | FRONTEND | UI acceptance/demo |
| Объяснимые факторы результата | CONNECTED RUNTIME + FRONTEND + PUBLIC docs | safe XAI payload + human acceptance + [EXPLAINABILITY.md](EXPLAINABILITY.md) |
| Акустический анализ речи | CONNECTED RUNTIME | runtime/model validation |
| Транскрипция/лингвистический анализ там, где входят в serving-конфигурацию | CONNECTED RUNTIME + FRONTEND | model-version manifest + E2E smoke |
| Scientific/methodological rationale | PUBLIC REPO | [METHODOLOGY.md](METHODOLOGY.md), [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md) |
| История/динамика сотрудника в CASE 2 | CONNECTED RUNTIME + FRONTEND, если включено release-конфигурацией | temporal/history smoke + UI demo; не выводится из technical external IDs |

## Архитектура и поставка

| Требование | Где реализовано | Как проверяется |
|---|---|---|
| Docker image / containerized integration | PUBLIC REPO + DEPLOYMENT | Docker build + smoke |
| Python / ML backend | PUBLIC REPO integration + CONNECTED RUNTIME inference | import/API tests + runtime readiness |
| On-prem deployment | PUBLIC REPO topology + deployment artifacts | [DEPLOYMENT.md](DEPLOYMENT.md) + environment smoke |
| Готовый ML pipeline | CONNECTED RUNTIME | model readiness + E2E inference |
| UI | FRONTEND | frontend build + UI demo/acceptance |
| Архитектура решения | PUBLIC REPO | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Инструкция по развёртыванию | PUBLIC REPO | [DEPLOYMENT.md](DEPLOYMENT.md) + frontend README |
| Компоненты и версии библиотек | PUBLIC REPO + VERSION-SPECIFIC runtime manifest | [COMPONENTS.md](COMPONENTS.md) + release manifest |

## CASE 1 — критерии проверки

| Критерий | Тип evidence |
|---|---|
| PR AUC как основная метрика для несбалансированной классификации | VALIDATION EVIDENCE конкретной model version |
| ROC AUC как дополнительная метрика | VALIDATION EVIDENCE |
| operating-point / precision-recall behavior | VALIDATION EVIDENCE |
| обработка спорных/недостаточных случаев | PUBLIC contract + CONNECTED RUNTIME + FRONTEND |
| раннее окно 60 сек | PUBLIC contract + DEPLOYMENT EVIDENCE |

Публичный CI проверяет integration/frontend contract и **не подменяет ML validation**.

## CASE 2 — критерии проверки

| Критерий | Тип evidence |
|---|---|
| ROC AUC целевого уровня | VALIDATION EVIDENCE конкретной model version |
| доступность и понятность объяснений | CONNECTED RUNTIME XAI + FRONTEND + human acceptance |
| early 180-sec decision | PUBLIC contract + DEPLOYMENT EVIDENCE |
| quality limitations | CONNECTED RUNTIME quality layer + Model Card |
| employee-period / history semantics, если используются | VERSION-SPECIFIC runtime + temporal validation + FRONTEND |

См. [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md).

## Требования к презентационному материалу

| Требование | Публичная опора |
|---|---|
| подход к разработке модели | [METHODOLOGY.md](METHODOLOGY.md) |
| научная методология | [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md) |
| ограничения | [LIMITATIONS_AND_RESPONSIBLE_USE.md](LIMITATIONS_AND_RESPONSIBLE_USE.md) |
| перспективы развития | [ROADMAP.md](ROADMAP.md) |
| сценарий демонстрации | [DEMO_GUIDE.md](DEMO_GUIDE.md) |

## Как читать эту матрицу

Плохая интерпретация:

> «Если в строке написано CONNECTED RUNTIME, значит требование ещё не сделано».

Правильная интерпретация:

> «Требование реализовано/проверяется в модельном runtime, который подключён через публичный contract, но его proprietary implementation не публикуется в Git».

То же относится к FRONTEND и VALIDATION EVIDENCE: это отдельные слои одного решения, а не список незавершённых задач.

## Public/private traceability

```text
public Git
  ├─ integration API / gateway
  ├─ frontend
  ├─ contracts
  ├─ Docker integration
  ├─ tests / CI
  └─ documentation

connected local model runtime
  ├─ case-specific serving artifacts
  ├─ preprocessing
  ├─ inference
  ├─ quality
  └─ model-specific XAI

validation / deployment evidence
  ├─ model-version metrics
  ├─ human XAI acceptance
  ├─ UI demonstration
  └─ on-prem smoke
```

## Acceptance rule

Перед финальной демонстрацией требование считается подтверждённым не по наличию одного файла в Git, а по совокупности применимых evidence:

```text
public code/contract
+ connected real runtime
+ CI
+ end-to-end smoke
+ version-specific validation evidence
+ UI demonstration
```

Актуальный checklist: [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md).
