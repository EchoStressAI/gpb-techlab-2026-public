# Соответствие ТЗ Газпромбанка · TechLab 2026

Этот документ сопоставляет официальный конкурсный ТЗ с фактическим состоянием EchoStressAI. Он специально разделяет три вещи:

```text
реализовано в public/source
≠
реализовано в connected model runtime
≠
подтверждено release-level evidence
```

Это важно, чтобы не выдавать наличие архитектуры или protocol за уже измеренное выполнение критерия.

## Обозначения

- **PUBLIC** — проверяется в этом repository.
- **FRONTEND** — реализовано в public UI.
- **CONNECTED RUNTIME** — относится к локальному versioned model runtime.
- **VALIDATION** — подтверждается model-validation report конкретной версии.
- **DEPLOYMENT EVIDENCE** — требует frozen deployment/smoke/benchmark.
- **HUMAN EVIDENCE** — требует отдельной проверки с людьми.
- **RELEASE CHECK** — не следует объявлять выполненным до фиксации runtime manifest / benchmark / acceptance evidence.

## 1. Целевые задачи

| Требование ТЗ | Текущее состояние EchoStressAI | Evidence |
|---|---|---|
| CASE 1: определить состояние клиента / риск нахождения под воздействием | Отдельный CASE 1 PRIMARY; финальный public claim ограничен клиентской стороной | CONNECTED RUNTIME + Model Card + VALIDATION |
| CASE 1: решение в первых 60 сек | Аналитический horizon зафиксирован как 60 сек | PUBLIC contract + runtime smoke |
| CASE 1: показать результат в интерфейсе | Реализован отдельный CASE 1 flow | FRONTEND |
| CASE 2: выявить риск эмоционального выгорания / неблагоприятного состояния | Отдельный CASE 2 PRIMARY с relative employee-period semantics | CONNECTED RUNTIME + Model Card + VALIDATION |
| CASE 2: решение в первых 180 сек | Аналитический horizon зафиксирован как 180 сек | PUBLIC contract + runtime smoke |
| CASE 2: постобработка записи | File upload и processing flow реализованы | PUBLIC + FRONTEND |
| CASE 2: показать результат в интерфейсе | Реализован отдельный CASE 2 flow | FRONTEND |

Связанные документы: [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md), [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md), [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md).

## 2. В ТЗ есть два разных временных требования — их нельзя смешивать

ТЗ содержит одновременно:

1. **аналитический horizon**: решение должно формироваться в первых 60 сек для CASE 1 и первых 180 сек для CASE 2;
2. **batch response-time expectation**: допустимое время ответа — до 60/180 сек в зависимости от задачи.

Public contract уже фиксирует **какой материал модель имеет право использовать**. Это не является измерением wall-clock latency.

Поэтому корректный status:

```text
fixed analysis horizon → implemented / contract-tested
end-to-end response time ≤60/180 sec → RELEASE CHECK / resource benchmark
```

До benchmark конкретного frozen runtime нельзя писать, что latency-критерий выполнен только потому, что model horizon равен 60/180 секундам.

См. [RESOURCE_BENCHMARK_PROTOCOL.md](RESOURCE_BENCHMARK_PROTOCOL.md).

## 3. Готовый ML pipeline

Public repository содержит frontend, integration API, runtime contracts/adapters, Docker/CI и tests. Реальный model inference выполняется connected case-specific runtime.

Это означает:

- public software layer воспроизводим и проверяем;
- model weights/training implementation не обязаны быть открытыми;
- финальный конкурсный snapshot должен связать public commit с конкретными runtime/model identities.

Evidence: [ARCHITECTURE.md](ARCHITECTURE.md), [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md), [SUBMISSION_MANIFEST.md](SUBMISSION_MANIFEST.md).

## 4. Акустика + транскрибированный текст + лингвистический анализ

ТЗ прямо требует анализа акустических свойств голоса и транскрибированного текста, включая лингвистический анализ.

Фактическая архитектура проекта **hybrid**:

- CASE 1 использует client-side semantic/text information и supporting speech-state context;
- CASE 2 исследовал acoustic, text и fusion branches;
- финальный CASE 2 PRIMARY выбран acoustic-first, потому что text/fusion не дал достаточного устойчивого прироста для оправдания дополнительной serving complexity.

Поэтому нельзя формулировать это как «каждый PRIMARY обязательно использует одновременно все модальности». Корректная формулировка:

> мультимодальный анализ реализован/исследован на уровне solution architecture, а состав конкретного frozen PRIMARY выбирается по validation.

Если заказчик трактует этот пункт как обязательное одновременное использование acoustic+text **в каждом финальном scorer**, это требует отдельного согласования: текущий CASE 2 PRIMARY намеренно acoustic-only.

## 5. Batch и импорт файлов

ТЗ требует:

- batch-processing накопленных данных;
- импорт файлов через UI;
- postprocessing.

Public frontend поддерживает очередь нескольких файлов и их обработку/отслеживание. Backend contract поддерживает job/batch-compatible processing semantics.

Evidence: `frontend/`, [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md), [API_REFERENCE.md](API_REFERENCE.md).

## 6. Требование к типу моделей: neural / transformer / open-source / non-LLM

Официальный ТЗ формулирует архитектурное ожидание как быстрые нейросетевые модели — трансформеры, open-source с открытым исходным кодом, не LLM.

Фактическое решение использует **разные model classes по слоям**:

```text
speech/state representation layers
+ acoustic/semantic representations
+ lightweight task-specific scorers
```

В исследовательских/state слоях используются neural speech representations. При этом финальные task-specific PRIMARY scorers могут быть легче и интерпретируемее; CASE 2 PRIMARY, например, сознательно не усложняется Transformer-блоком только ради формальной однородности.

Поэтому этот пункт нельзя считать автоматически закрытым одной архитектурной фразой. Для финального acceptance требуется **runtime manifest**, где зафиксированы model families, source/license и роли компонентов.

Отдельная оговорка:

> если требование интерпретируется буквально как «каждый финальный task-specific scorer обязан сам быть Transformer-моделью», текущая hybrid architecture не соответствует такой буквальной трактовке и это нужно согласовать с заказчиком, а не маскировать документацией.

См. [MODEL_RESOURCE_PROFILE.md](MODEL_RESOURCE_PROFILE.md) и [DEPENDENCIES_AND_LICENSES.md](DEPENDENCIES_AND_LICENSES.md).

## 7. Запрещённые готовые модели

ТЗ запрещает использовать как готовые модели решения:

```text
TIM-Net
«АБК»
GigaAM Emo
```

Public Git не содержит этих artifacts. Однако окончательная проверка относится не только к public repo, но и к connected runtime.

Status: **RELEASE CHECK** — подтвердить runtime manifest/SBOM.

## 8. Ограничение 1×NVIDIA A100

ТЗ задаёт GPU ceiling `1 × NVIDIA A100`.

Public integration/frontend GPU не требует. Но это не доказывает, что вся connected inference topology укладывается в ceiling.

Status:

```text
architecture → compatible by design
measured full-runtime compliance → RELEASE CHECK
```

Нужен benchmark конкретного snapshot:

- CASE 1 + CASE 2 runtime;
- cold/warm processing;
- peak VRAM;
- host RAM;
- latency;
- concurrency;
- external-network audit;
- container/model identities.

## 9. Docker / Python / on-prem

| Требование ТЗ | Состояние |
|---|---|
| Docker image | public API/frontend images и compose build проверяются CI; connected runtime image identity фиксируется отдельно |
| Python preferred | public backend — Python/FastAPI |
| PyTorch и аналогичные библиотеки | version-specific model runtime; фиксируется manifest/SBOM |
| On-prem | topology и deployment guide предусмотрены; full connected-runtime smoke — DEPLOYMENT EVIDENCE |

См. [DEPLOYMENT.md](DEPLOYMENT.md), [SYSTEM_REQUIREMENTS.md](SYSTEM_REQUIREMENTS.md), [COMPONENTS.md](COMPONENTS.md).

## 10. Образ финального MVP

Public repository содержит:

```text
frontend
+ integration API
+ runtime contracts/adapters
+ Docker integration
+ CI/tests
+ evaluator-facing documentation
```

Реальный model inference появляется при подключении frozen runtime. Если runtime отсутствует или нарушает contract, система fail-closed.

Для утверждения «финальный MVP полностью готов» нужен один зафиксированный end-to-end snapshot с реальными runtime/model/container identities и smoke evidence.

## 11. Требования к презентации и документации

| Требование ТЗ | Где раскрыто |
|---|---|
| Подход к разработке | [METHODOLOGY.md](METHODOLOGY.md), [MODEL_SELECTION_AUDIT.md](MODEL_SELECTION_AUDIT.md) |
| Научная база | [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md), [SCIENTIFIC_REFERENCES.md](SCIENTIFIC_REFERENCES.md) |
| Ограничения | [LIMITATIONS_AND_RESPONSIBLE_USE.md](LIMITATIONS_AND_RESPONSIBLE_USE.md) |
| Перспективы / альтернативные сценарии | [ROADMAP.md](ROADMAP.md) |
| Команда / регалии | [TEAM.md](TEAM.md) |
| Архитектура | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Инструкция по развёртыванию | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Компоненты / версии | [COMPONENTS.md](COMPONENTS.md), [DEPENDENCIES_AND_LICENSES.md](DEPENDENCIES_AND_LICENSES.md) |

## 12. Критерии CASE 1

ТЗ:

- основная метрика — PR AUC;
- ROC AUC — дополнительная, ориентир 75%;
- каскад допустим, но не обязателен;
- при каскаде отдельно рассматриваются precision безопасного класса и weighted F1.

Public validation snapshot:

```text
CLIENT-only PRIMARY
PR AUC       0.3654
ROC AUC      0.7569
Weighted F1  0.8190
```

Высокий operator-side result не используется как финальный client-state claim после workflow-shortcut audit.

Evidence: [PUBLIC_VALIDATION_RESULTS.md](PUBLIC_VALIDATION_RESULTS.md), [MODEL_SELECTION_AUDIT.md](MODEL_SELECTION_AUDIT.md).

## 13. Критерии CASE 2

ТЗ:

```text
ROC AUC ≥ 0.75
human explainability / accessibility ≥ 80%
```

Текущий competition/internal validation snapshot:

```text
Period ROC AUC          0.8701
Period PR AUC           0.8060
Operator-equal ROC AUC  ~0.882
```

Это подтверждает превышение целевого ROC AUC **в текущем internal competition protocol**, но не заменяет внешнюю hidden/population validation.

Критерий объяснимости ≥80% пока нельзя считать измеренно выполненным. Нужен отдельный зафиксированный human-acceptance test среди целевой аудитории HR.

См. [EXPLAINABILITY_ACCEPTANCE_PROTOCOL.md](EXPLAINABILITY_ACCEPTANCE_PROTOCOL.md).

## 14. Что уже проверяется CI, а что CI не доказывает

CI может подтвердить:

- public hygiene;
- Python tests/import;
- frontend build/typecheck;
- Docker/compose build;
- API-container `/health` smoke.

CI public repo **не доказывает**:

- реальную ML quality закрытого runtime;
- full on-prem E2E inference;
- latency полного pipeline;
- 1×A100 resource ceiling;
- human explainability ≥80%;
- внешнюю bank hidden validation.

## 15. Remaining release-level evidence

Перед freeze evaluator snapshot нужно заполнить:

- [ ] public commit/tag;
- [ ] CASE 1 model_id + runtime build;
- [ ] CASE 2 model_id + runtime build;
- [ ] validation report identity/date;
- [ ] connected-runtime container/image digests;
- [ ] on-prem E2E smoke;
- [ ] measured 1×A100 resource/latency report;
- [ ] human explainability acceptance report;
- [ ] runtime dependency/license manifest;
- [ ] forbidden-model check;
- [ ] final public/private leakage review.

## 16. Итог

Сильная сторона решения — не декларация «всё выполнено», а проверяемое разделение:

```text
что уже реализовано
что уже измерено
что доказано только на current validation
что ещё требует release-level evidence
```

Такой подход позволяет обсуждать конкурсный MVP честно и технически предметно, не раскрывая proprietary model IP и не завышая степень validation.
