# Requirements Traceability Matrix

Этот документ сопоставляет ключевые требования конкурсного задания с публичной архитектурой репозитория. Матрица предназначена для навигации и **не подменяет version-specific acceptance report**.

Статусы:

- **PUBLIC DONE** — реализовано/описано в этом public repo;
- **RUNTIME** — реализуется case-specific model runtime;
- **UI** — реализуется пользовательским интерфейсом;
- **VALIDATION** — подтверждается отдельным validation report конкретной модели;
- **DEPLOYMENT** — проверяется на собранной on-prem версии;
- **KNOWN GAP** — механизм реализован внутри runtime, но не выведен в публичный/пользовательский контракт; признанный, а не скрытый недостаток текущей версии.

## Функциональные требования

| Требование | Ответственный слой | Статус / ссылка |
|---|---|---|
| CASE 1: анализ состояния клиента | CASE 1 runtime + public API | RUNTIME; [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md) |
| Решение CASE 1 в первых 60 сек | integration contract + runtime | PUBLIC DONE / RUNTIME; [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md) |
| CASE 2: анализ состояния сотрудника | CASE 2 runtime + public API | RUNTIME; [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md) |
| Решение CASE 2 в первых 180 сек | integration contract + runtime | PUBLIC DONE / RUNTIME |
| Импорт файла для постобработки | public API / UI | PUBLIC DONE; [frontend/src/components/DropZone.tsx](../frontend/src/components/DropZone.tsx) |
| Batch/MVP processing | integration/runtime deployment | расширяемый слой; version-specific |
| Отображение результата в интерфейсе | frontend | PUBLIC DONE; [frontend/src/features/calls/ResultPanel.tsx](../frontend/src/features/calls/ResultPanel.tsx) |
| Объяснимые факторы результата | runtime + frontend | PUBLIC DONE (UI) / RUNTIME (числа); [EXPLAINABILITY.md](EXPLAINABILITY.md), [frontend/src/features/calls/RiskPanel.tsx](../frontend/src/features/calls/RiskPanel.tsx) |
| Акустический анализ речи | case runtime | RUNTIME |
| Транскрипция/лингвистический анализ, если входят в финальную serving-конфигурацию | case runtime | RUNTIME; model-version specific |
| Scientific/methodological rationale | documentation | PUBLIC DONE; [METHODOLOGY.md](METHODOLOGY.md), [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md) |
| Накопление статистики по каждому оператору (CASE 2 employee-period history) | case runtime + отдельный read-endpoint | KNOWN GAP: causal per-operator накопление реализовано внутри runtime и используется для period-level score, но отдельный публичный/пользовательский endpoint просмотра накопленной истории конкретного оператора пока не реализован |

## Архитектура и поставка

| Требование | Ответственный слой | Статус / ссылка |
|---|---|---|
| Docker image | public integration / final deployment | PUBLIC DONE для integration API; runtime image отдельно |
| Python / ML backend | integration + runtime | PUBLIC DONE для API; RUNTIME для inference |
| On-prem deployment | deployment topology | PUBLIC architecture ready; [DEPLOYMENT.md](DEPLOYMENT.md) |
| Готовый ML pipeline | case runtime | RUNTIME |
| UI с минимальной конфигурацией | frontend | PUBLIC DONE; [frontend/README.md](../frontend/README.md) |
| Архитектура решения | documentation | PUBLIC DONE; [ARCHITECTURE.md](ARCHITECTURE.md) |
| Инструкция по развёртыванию | documentation | PUBLIC DONE; [DEPLOYMENT.md](DEPLOYMENT.md) |
| Компоненты и версии библиотек | public package + runtime release manifest | PUBLIC DONE для integration; runtime version-specific; [COMPONENTS.md](COMPONENTS.md) |

## CASE 1 — критерии проверки

| Критерий | Где подтверждается |
|---|---|
| PR AUC как основная метрика для несбалансированной классификации | version-specific validation report |
| ROC AUC как дополнительная метрика | version-specific validation report |
| operating-point / precision-recall behavior | version-specific validation report |
| обработка спорных/недостаточных случаев | quality/evidence contract + UI |

Публичный CI **не объявляется подтверждением ML-метрик**.

## CASE 2 — критерии проверки

| Критерий | Где подтверждается |
|---|---|
| ROC AUC целевого уровня | version-specific validation report |
| доступность и понятность объяснений | XAI + human acceptance protocol |
| early 180-sec decision | runtime contract + E2E smoke |
| quality limitations | runtime quality layer + Model Card |

См. [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md).

## Требования к презентационному материалу

| Требование | Публичная опора |
|---|---|
| подход к разработке модели | [METHODOLOGY.md](METHODOLOGY.md) |
| научная методология | [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md) |
| ограничения | [LIMITATIONS_AND_RESPONSIBLE_USE.md](LIMITATIONS_AND_RESPONSIBLE_USE.md) |
| перспективы развития | [ROADMAP.md](ROADMAP.md) |
| сценарий демонстрации | [DEMO_GUIDE.md](DEMO_GUIDE.md) |

## Public/private traceability

Требование «проверяемый проект» не означает, что public Git должен содержать банковские данные, training notebooks или универсальное proprietary know-how.

В этом submission разделены:

```text
public Git
  ├─ API
  ├─ contracts
  ├─ Docker integration
  ├─ tests
  └─ documentation

local/private serving runtime
  ├─ case-specific model artifacts
  ├─ preprocessing
  ├─ inference
  └─ model-specific XAI/quality
```

## Acceptance rule

Перед финальной демонстрацией требования считаются закрытыми не по наличию документа, а по совокупности:

```text
code/contract
+ connected real runtime
+ CI
+ end-to-end smoke
+ version-specific validation evidence
+ UI demonstration
```

Актуальный checklist: [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md).
