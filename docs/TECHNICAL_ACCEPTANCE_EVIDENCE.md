# Technical Acceptance Evidence Matrix

Этот документ переводит требования конкурсного ТЗ в **конкретные проверяемые acceptance actions**. Он нужен, чтобы перед демонстрацией/проверкой не оставалось формулировок вида «кажется, это у нас есть».

## 1. Формат evidence

Каждая строка должна закрываться одним или несколькими типами evidence:

- **SOURCE** — код/contract/docs в public repo;
- **CI** — автоматическая проверка;
- **RUNTIME** — проверка подключённого model runtime;
- **E2E** — end-to-end от файла до UI/API result;
- **MODEL VALIDATION** — метрика конкретной model version;
- **HUMAN VALIDATION** — оценка экспертом/пользователем;
- **DEPLOYMENT** — проверка финального контейнера/topology.

## 2. CASE 1

| Acceptance item | Evidence | Pass condition |
|---|---|---|
| Анализ CASE 1 доступен | SOURCE + RUNTIME | runtime ready; gateway принимает `CASE_1` |
| Используется раннее окно | contract + E2E | horizon = 60 sec; поздний материал не влияет |
| Целевая сторона — клиент | runtime/provenance | клиентская речь является PRIMARY input |
| Недостаток речи не становится low risk | contract + E2E | отдельный insufficient/limited evidence outcome |
| PRIMARY score имеет корректную семантику | UI + Model Card | не называется probability без calibration evidence |
| PR AUC | MODEL VALIDATION | опубликована для frozen model/protocol |
| ROC AUC | MODEL VALIDATION | опубликована как дополнительная метрика |
| Weighted F1 / operating point | MODEL VALIDATION | привязаны к frozen protocol |
| Safe-negative precision/cascade, если используется | MODEL VALIDATION | precision/coverage опубликованы вместе |
| Shortcut/operator-workflow контроль | research/validation evidence | финальный claim не основан на процедурном артефакте |
| UI показывает результат | FRONTEND + E2E | score/status/quality видимы пользователю |

## 3. CASE 2

| Acceptance item | Evidence | Pass condition |
|---|---|---|
| Анализ CASE 2 доступен | SOURCE + RUNTIME | runtime ready; gateway принимает `CASE_2` |
| Рабочее окно | contract + E2E | horizon = 180 sec |
| Целевая сторона — сотрудник | runtime/provenance | операторская/employee speech используется корректно |
| Постобработка файла | FRONTEND + E2E | файл импортируется через UI и получает result |
| Batch / очередь файлов | FRONTEND + E2E | несколько файлов принимаются в одну пользовательскую очередь и отслеживаются |
| Acoustic analysis | RUNTIME | acoustic feature/model path работает |
| Text/linguistic branch | architecture/runtime | поддерживается/исследован отдельно; inclusion в PRIMARY зависит от validation |
| ROC AUC ≥0.75 | MODEL VALIDATION | конкретная frozen version проходит criterion |
| Explainability доступна | SOURCE + FRONTEND | пользователю видны безопасные факторы/ограничения |
| Explainability ≥80% | HUMAN VALIDATION | заранее определённый acceptance protocol даёт ≥80% |
| Один звонок не превращается в диагноз | UI + Model Card | score трактуется как model signal / period risk, не medical fact |
| History/period semantics не используют будущее | E2E + temporal test | as-of chronology соблюдается |

## 4. Общий pipeline

| Requirement | Evidence | Pass condition |
|---|---|---|
| Python backend | SOURCE | public API на Python; runtime manifest фиксирует backend stack |
| Docker image | CI + DEPLOYMENT | image собирается из clean checkout |
| Docker Compose/topology | SOURCE + DEPLOYMENT | compose config валиден; services связываются локально |
| On-prem | DEPLOYMENT | inference выполняется без обязательной передачи аудио наружу |
| No fake score | tests + E2E | runtime unavailable → явный technical status/503 |
| UI с минимальной конфигурацией | FRONTEND | пользователь выбирает case/files, остальное определяется pipeline |
| API contracts | tests | contract tests green |
| Logs / sensitive payload | security review | audio/full transcript не логируются по умолчанию |
| Secrets | public hygiene | нет `.env`, токенов, credentials в public tree |

## 5. Model/runtime constraints

| Constraint | Evidence | Pass condition |
|---|---|---|
| Не generative LLM в scoring path | runtime manifest | отсутствует обязательная LLM-зависимость для PRIMARY inference |
| Fast/open-source model components | runtime manifest/licenses | model families и лицензии документированы |
| TIM-Net не используется как запрещённая ready model | runtime manifest | отсутствует |
| «АБК» не используется как запрещённая ready model | runtime manifest | отсутствует |
| GigaAM Emo не используется как запрещённая ready model | runtime manifest | отсутствует |
| GPU ceiling 1×A100 | benchmark | full runtime проходит на согласованном 1×A100 profile |

## 6. Runtime performance benchmark

Для каждого CASE записать:

```text
release commit/tag:
runtime build:
model_id:
input duration:
horizon:
GPU:
peak VRAM:
peak RAM:
wall-clock latency:
concurrency:
result status:
```

Критично различать:

- **analysis horizon** — сколько первых секунд разговора модель имеет право использовать;
- **processing latency** — сколько времени технически занял inference.

Эти величины связаны, но не являются одним и тем же показателем.

## 7. Presentation/documentation acceptance

| Требование | Evidence |
|---|---|
| Подход к разработке | `METHODOLOGY.md` |
| Научная база | `SCIENTIFIC_BACKGROUND.md` |
| Ограничения | `LIMITATIONS_AND_RESPONSIBLE_USE.md` |
| Перспективы | `ROADMAP.md` |
| Команда | `TEAM.md` |
| Архитектура | `ARCHITECTURE.md` |
| Развёртывание | `DEPLOYMENT.md` |
| Компоненты/версии | `COMPONENTS.md` + runtime manifest |

## 8. Acceptance order

Рекомендуемый порядок финальной проверки:

```text
1. public hygiene
2. Python tests
3. frontend build
4. Docker build
5. compose/config smoke
6. runtime readiness
7. CASE 1 E2E
8. CASE 2 E2E
9. resource benchmark
10. version-specific ML metrics
11. human explainability acceptance
12. freeze commit/tag + runtime identities
```

## 9. Что нельзя считать evidence

Не являются достаточным подтверждением сами по себе:

- зелёный GitHub CI для заявления ROC/PR AUC;
- один красивый demo-call;
- screenshot UI без connected runtime;
- наличие XAI-графика для заявления «объяснимость ≥80%»;
- theoretical GPU compatibility без benchmark;
- наличие Dockerfile без успешной сборки конкретного snapshot.

## 10. Итоговый pass rule

Финальный snapshot считается технически готовым к evaluator review, когда для каждого applicable требования есть **явный тип evidence и воспроизводимый способ проверки**.

Это позволяет отдельно видеть:

```text
что реализовано в source
что проверяет CI
что подтверждает model validation
что подтверждается только connected runtime
что ещё требует human/deployment acceptance
```