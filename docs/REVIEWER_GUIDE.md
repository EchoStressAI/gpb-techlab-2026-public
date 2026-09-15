# Reviewer Guide · EchoStressAI GPB TechLab 2026

Этот документ — короткий маршрут для жюри, заказчика и технического reviewer. Его задача — позволить понять решение за 5–10 минут, не заставляя читать весь репозиторий подряд.

## 1. Что решает система

В проекте два независимых банковских сценария:

- **CASE 1** — ранний дополнительный сигнал риска внешнего психологического воздействия на клиента;
- **CASE 2** — речевой сигнал состояния сотрудника с интерпретацией на уровне рабочего периода/динамики, а не как медицинский диагноз.

Рабочие горизонты зафиксированы:

```text
CASE 1 → первые 60 секунд
CASE 2 → первые 180 секунд
```

Это часть model contract, а не UI-настройка.

## 2. Что посмотреть сначала

Рекомендуемый порядок:

1. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — что решаем;
2. [MODEL_SEMANTICS.md](MODEL_SEMANTICS.md) — что фактически анализирует ML на безопасном смысловом уровне;
3. [DIAGRAMS.md](DIAGRAMS.md) — архитектура;
4. [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md) и [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md) — модельные границы;
5. [VALIDATION_EVIDENCE_INDEX.md](VALIDATION_EVIDENCE_INDEX.md) — где и чем подтверждается качество;
6. [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md) — соответствие требованиям;
7. [SUBMISSION_MANIFEST.md](SUBMISSION_MANIFEST.md) — состав публичной части и подключаемых компонентов.

## 3. Как устроено решение

```text
Frontend
   ↓
Public integration/API layer
   ↓
case routing + fixed horizon
   ↓
local CASE 1 / CASE 2 model runtime
   ↓
PRIMARY result + quality/evidence + safe explanation
```

Публичный репозиторий содержит проверяемый integration/UI слой и документацию. Case-specific serving artifacts могут подключаться локально и не обязаны публиковаться как открытые model weights/source.

## 4. Что важно увидеть в CASE 1

Reviewer должен проверить пять вещей:

1. анализируется именно клиентская сторона;
2. используется раннее окно 60 секунд;
3. score не называется вероятностью, если он не откалиброван как вероятность;
4. недостаток клиентской речи приводит к `insufficient evidence`, а не автоматически к низкому риску;
5. итоговый сигнал сопровождается качеством наблюдения и рекомендацией следующего шага.

Смысловая структура CASE 1 описана в [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md).

## 5. Что важно увидеть в CASE 2

Reviewer должен проверить:

1. анализируется речь сотрудника;
2. рабочее окно — 180 секунд;
3. используются интерпретируемые семейства акустико-речевой информации;
4. score трактуется как относительный model signal/индекс, а не как диагноз или автоматическое HR-решение;
5. speech coverage, history availability и другие ограничения не скрываются внутри одного числа;
6. explainability описывает поведение модели, а не причинный психологический диагноз.

Подробнее: [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md).

## 6. Что означает public/private boundary

Публичная проверяемость здесь означает, что можно увидеть:

- API и frontend;
- case routing;
- фиксированные временные окна;
- contracts;
- Docker/integration topology;
- fail-closed поведение;
- quality/evidence semantics;
- model cards;
- validation protocol;
- scientific rationale;
- synthetic tests.

При этом публичность **не требует** раскрывать:

- банковские аудио/транскрипты;
- training datasets/notebooks;
- model weights;
- точные coefficients/scalers/imputers;
- внутреннюю формулу тревожности;
- универсальную интегральную/fusion/personal-baseline методологию EchoStressAI.

Подробнее: [IP_AND_PUBLIC_BOUNDARY.md](IP_AND_PUBLIC_BOUNDARY.md).

## 7. Как читать validation

Нужно различать три разные вещи:

```text
CI / contract correctness
≠
ML performance
≠
expert/semantic validity
```

GitHub Actions проверяет код, contracts и public hygiene. Model quality подтверждается отдельным version-specific validation evidence. Экспертная рецензия помогает проверять интерпретацию и классы ошибок, но не объявляется банковской ground truth.

См. [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md) и [CASE2_EXPERT_REVIEW_LESSONS.md](CASE2_EXPERT_REVIEW_LESSONS.md).

## 8. Что считать сильным результатом демонстрации

Хорошая демонстрация должна показать не только успешный score, но и корректное поведение системы на границах:

- CASE 1 и CASE 2 маршрутизируются независимо;
- применяются правильные horizons;
- score сопровождается semantic label/quality;
- `limited/insufficient evidence` виден пользователю;
- недоступный runtime не заменяется synthetic/fake score;
- frontend не выдаёт supporting signal за PRIMARY;
- результат не интерпретируется сильнее, чем позволяет validation.

## 9. Как быстро проверить техническую часть

После запуска:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -i http://127.0.0.1:8080/api/v1/readiness
```

Для end-to-end проверки требуется подключённый локальный case runtime и безопасный demo-аудиофайл. Отсутствие runtime должно давать явное fail-closed состояние.

## 10. Частые вопросы

**Почему model weights не лежат в public Git?**  
Публичный Git предназначен для прозрачности архитектуры, интерфейсов, поведения и методологии. Serving artifacts могут поставляться/подключаться отдельно без публикации proprietary weights.

**Можно ли считать CASE 2 медицинской диагностикой?**  
Нет. Это speech-based research/operational signal и human-in-the-loop инструмент.

**Почему один score недостаточен?**  
Потому что качество наблюдения, фактический объём речи и ограничения конкретного звонка могут существенно влиять на интерпретацию.

**Почему эксперт и модель могут расходиться?**  
Они могут видеть разные временные окна, разные конструкты и разный объём релевантного материала. Это отдельно разобрано в expert-review documentation.

## 11. Рекомендуемый финальный маршрут

```text
Overview
→ Model Semantics
→ Model Cards
→ Architecture
→ Validation Evidence
→ Requirements Traceability
→ Demo
→ Limitations / Responsible Use
```

Такой порядок даёт сначала смысл решения, затем техническую проверяемость и только потом детали ограничений.