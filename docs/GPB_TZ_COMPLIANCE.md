# Соответствие ТЗ Газпромбанка · TechLab 2026

Этот документ сопоставляет требования конкурсного ТЗ с фактической архитектурой и доказательствами проекта EchoStressAI. Его цель — дать reviewer прямой ответ на вопрос **«где в решении закрыто каждое требование»**, не подменяя model validation техническим CI и не раскрывая proprietary model IP.

Статусы ниже описывают не «сделано / не сделано», а **тип реализации и доказательства**:

- **PUBLIC** — проверяется в этом public repository;
- **CONNECTED RUNTIME** — реализуется подключаемым локальным model runtime;
- **FRONTEND** — реализуется пользовательским интерфейсом;
- **VALIDATION** — подтверждается version-specific model evidence;
- **DEPLOYMENT** — подтверждается собранным deployment snapshot / smoke;
- **HUMAN VALIDATION** — требует отдельной проверки с людьми/экспертами.

## 1. Целевые задачи

| Требование ТЗ | Реализация EchoStressAI | Evidence |
|---|---|---|
| CASE 1: определить риск нахождения клиента под внешним воздействием | Отдельный CASE 1 PRIMARY; анализируется клиентская сторона | CONNECTED RUNTIME + CASE 1 Model Card |
| CASE 1: решение в первые 60 секунд | Horizon зафиксирован как часть контракта | PUBLIC contract + runtime smoke |
| CASE 1: результат отображается в интерфейсе | Отдельный CASE 1 экран/результат | FRONTEND |
| CASE 2: оценить риск неблагоприятного профессионального состояния / выгорания | Отдельный CASE 2 PRIMARY с осторожной интерпретацией как relative model signal | CONNECTED RUNTIME + CASE 2 Model Card |
| CASE 2: решение в первые 180 секунд | Horizon зафиксирован как часть контракта | PUBLIC contract + runtime smoke |
| CASE 2: постобработка записи | Upload/API/UI работают с загруженными файлами | PUBLIC + FRONTEND |
| CASE 2: результат отображается в интерфейсе | Отдельный CASE 2 result flow | FRONTEND |

Связанные документы: [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md), [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md), [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md).

## 2. Функциональность

### Готовый ML pipeline

Public repository содержит transport/integration/UI слой. Реальный inference выполняется case-specific локальными runtime-компонентами. Это позволяет оставить serving artifacts и model weights вне открытого Git, сохранив воспроизводимый API contract.

Evidence:

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md)
- [GPB_AUDIO_RISK_ADAPTER.md](GPB_AUDIO_RISK_ADAPTER.md)

### Акустика + транскрибированный текст + лингвистический анализ

В проекте исследованы и поддерживаются **акустический и текстовый контуры**, но финальная PRIMARY-конфигурация выбирается по validation, а не по принципу «обязательно слить все модальности».

- CASE 1 использует клиентский речевой/семантический контекст и supporting state information;
- CASE 2 PRIMARY использует объяснимый акустический путь, потому что в текущей validation он оказался сильнее и проще для deployment;
- текстовый CASE 2 контур исследован отдельно и может подключаться как дополнительный semantic layer, но не объявляется частью PRIMARY только ради формального усложнения архитектуры.

Таким образом, требование мультимодального анализа закрывается **на уровне solution architecture**, при этом конкретный production scorer может использовать подмножество модальностей, если это подтверждено validation.

Методологическая граница описана в [METHODOLOGY.md](METHODOLOGY.md) и [EXPLAINABILITY.md](EXPLAINABILITY.md).

### Batch / набор накопленных записей

Frontend позволяет добавить **несколько файлов в одну очередь**, после чего они отправляются и отслеживаются как набор заданий. Реализация может отправлять записи поштучно внутри UI-очереди для более прозрачной обработки ошибок и progress по каждому файлу; это не меняет batch-сценарий для пользователя.

Backend API также предусматривает batch-compatible processing flow.

### Импорт файлов через UI

Реализован drag-and-drop / file picker; допускается очередь из нескольких записей. См. `frontend/` и [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md).

## 3. Ограничения по моделям и архитектуре

### Не LLM

Основной scoring path не должен зависеть от генеративной LLM. Для speech representations допустимы специализированные speech/audio encoders; downstream task-specific scorers могут быть легче и интерпретируемее, если это даёт лучшую validation/deployment trade-off.

EchoStressAI использует **hybrid architecture**: representation / acoustic / semantic layers и отдельные task-specific scorers. Мы не утверждаем, что каждый downstream scorer сам является Transformer.

### Open-source / transformer expectations

ТЗ ориентирует решение на быстрые open-source neural/transformer models. В проекте такой класс моделей используется в speech/state research/runtime layers; финальные PRIMARY scorers выбираются по качеству, интерпретируемости и устойчивости.

Точный runtime manifest конкретного релиза должен фиксировать используемые model/framework identities и лицензии.

### Запрещённые готовые модели

ТЗ отдельно запрещает использование готовых TIM-Net / «АБК» / GigaAM Emo как готовых моделей решения. Public repository не содержит этих model artifacts. Перед финальным connected-runtime snapshot это должно быть подтверждено runtime manifest/SBOM.

## 4. Вычислительные ограничения

ТЗ задаёт верхний ориентир **1 × NVIDIA A100**.

Public integration layer GPU не требует. Ресурсный профиль ML runtime является свойством конкретной serving-версии и должен подтверждаться deployment benchmark.

Принцип acceptance:

```text
public API/frontend
+ CASE 1 runtime
+ CASE 2 runtime
<= согласованный ресурсный профиль 1 × A100
```

До появления зафиксированного benchmark нельзя выдавать теоретическую совместимость за измеренный production result.

См. [SYSTEM_REQUIREMENTS.md](SYSTEM_REQUIREMENTS.md).

## 5. Код и сборка

| Требование ТЗ | Реализация |
|---|---|
| Docker image | Dockerfile + compose topology; final connected-runtime image/digest фиксируется отдельно |
| Python preferred | Public backend — Python/FastAPI; runtime contract не мешает Python/PyTorch model serving |
| PyTorch и аналогичные ML-библиотеки | относятся к concrete model runtime; public gateway не требует тащить ML framework в integration image |
| On-prem | архитектура рассчитана на локальный runtime без передачи аудио во внешний cloud |

См. [DEPLOYMENT.md](DEPLOYMENT.md), [SYSTEM_REQUIREMENTS.md](SYSTEM_REQUIREMENTS.md), [COMPONENTS.md](COMPONENTS.md).

## 6. Образ финального решения

ТЗ ожидает готовое MVP с UI и backend ML pipeline.

В public repository находятся:

```text
frontend
+ integration API
+ runtime contracts/adapters
+ Docker integration
+ tests
+ documentation
```

Подключаемые model runtime дают реальный CASE 1 / CASE 2 inference. Отсутствие runtime не маскируется fake score: система работает fail-closed.

## 7. Презентационные требования

| Требование | Где раскрыто |
|---|---|
| Подход к разработке модели | [METHODOLOGY.md](METHODOLOGY.md) |
| Научная/методологическая база | [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md) |
| Ограничения | [LIMITATIONS_AND_RESPONSIBLE_USE.md](LIMITATIONS_AND_RESPONSIBLE_USE.md) |
| Перспективы развития / альтернативные сценарии | [ROADMAP.md](ROADMAP.md) |
| Команда, регалии, роли | [TEAM.md](TEAM.md) |

## 8. Сопроводительная документация

| Требование | Документ |
|---|---|
| Архитектура | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Инструкция по развёртыванию | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Компоненты / библиотеки | [COMPONENTS.md](COMPONENTS.md) |
| Системные требования | [SYSTEM_REQUIREMENTS.md](SYSTEM_REQUIREMENTS.md) |
| API | [API_REFERENCE.md](API_REFERENCE.md) |
| Runtime contract | [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md) |
| ИБ / privacy | [DATA_PRIVACY_SECURITY.md](DATA_PRIVACY_SECURITY.md) |
| Финальная проверка | [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md) |

## 9. Критерии оценивания CASE 1

ТЗ делает основной метрикой **PR AUC**, дополнительной — ROC AUC, а для каскадного сценария отдельно рассматривает высокую precision безопасного класса и weighted F1.

В EchoStressAI каскадность рассматривается как **опциональная operational pattern**, а не обязательная архитектура. Ключевой принцип финальной модели — не оптимизировать метрику за счёт процедурного shortcut/operator workflow.

Поэтому CASE 1 evidence должен включать:

- PR AUC;
- ROC AUC;
- Weighted F1;
- Precision/coverage для safe-negative режима, если он используется;
- долю `INSUFFICIENT_EVIDENCE`;
- fixed 60-sec protocol;
- leakage/shortcut audit.

Правила публикации метрик: [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md).

## 10. Критерии оценивания CASE 2

ТЗ задаёт:

- ROC AUC не ниже 0.75;
- прозрачность/доступность объяснений не ниже 80%.

Эти два критерия требуют **разного evidence**:

### ROC AUC

Подтверждается version-specific model validation с описанием split/grouping, sample size, horizon и model identity.

### Explainability ≥80%

Не должно подменяться наличием SHAP/feature contributions или красивого UI. Это отдельный **human-acceptance criterion**: заранее определённый набор кейсов, анкета/критерии понятности, респонденты и правило расчёта 80%.

До проведения такого protocol корректная формулировка — «объяснения реализованы и доступны», а не «80% объяснимости достигнуто».

## 11. Что остаётся version-specific acceptance evidence

Даже при полном public repo следующие вещи должны фиксироваться для конкретного финального snapshot:

- public commit/tag;
- CASE 1 / CASE 2 model IDs;
- model validation report;
- full Docker/runtime image identity;
- 1×A100 resource benchmark;
- end-to-end latency 60/180 sec;
- human explainability acceptance;
- on-prem smoke;
- dependency/runtime manifest.

Это не недостаток public Git: это правильное разделение **source transparency** и **release evidence**.

## 12. Итог

Проект закрывает требования ТЗ не одним артефактом, а совокупностью:

```text
public code
+ frontend
+ connected model runtime
+ validation evidence
+ deployment evidence
+ human explainability validation
```

Именно эта совокупность должна оцениваться как конкурсное решение.