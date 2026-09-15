# Dataset & Split Summary · Public-safe

Этот документ фиксирует только **агрегированную структуру данных**, необходимую для интерпретации validation. Он не содержит банковские file IDs, operator IDs, транскрипты, row-level predictions или внутренние пути хранения.

## 1. Зачем нужен этот документ

Метрики без понимания единицы наблюдения и состава выборки легко трактовать неправильно. Поэтому для каждого кейса отдельно фиксируются:

- что является объектом наблюдения;
- какие данные имели известные labels;
- какая часть использовалась как CONTROL;
- какие ограничения есть у текущего validation design.

## 2. CASE 1 · внешний психологический контекст

### Агрегированная разметка

В финальном исследовательском контуре использовалось:

```text
300 labeled calls
45 positive
255 negative
```

Отдельно существует `CONTROL60`, для которого целевые labels не раскрыты команде во время анализа.

Это принципиально: CONTROL нельзя использовать для заявления AUC/PR AUC без истинных labels.

### Fixed-horizon subset

Bank-safe PRIMARY работает на раннем клиентском материале в пределах 60 секунд.

Для labeled `exact60`-подмножества:

```text
209 calls с применимым exact60 protocol
22/209 → insufficient evidence
6 из 22 insufficient-evidence cases были positive
```

Для CONTROL:

```text
60 calls total
10/60 → insufficient evidence
labels unknown
```

### Что означает insufficient evidence

Эти записи не должны автоматически превращаться в negative/low-risk prediction. Отдельный outcome нужен, потому что клиент мог почти не говорить или релевантного материала в раннем окне было недостаточно.

### Что нельзя выводить из CONTROL60

Некорректно:

```text
«CONTROL подтвердил AUC»
«на CONTROL точность X%»
```

если истинные labels CONTROL недоступны.

Корректно публиковать только label-free характеристики, например:

- coverage;
- число insufficient-evidence cases;
- распределение model score без claims о качестве;
- техническую воспроизводимость inference.

## 3. CASE 2 · employee-period risk

### TRAIN / CONTROL structure

Текущий frozen validation context:

```text
98 TRAIN calls
11 TRAIN employees
25 TRAIN employee-periods

60 CONTROL calls
4 CONTROL employees
```

CONTROL не использовался при выборе финального PRIMARY scorer.

### Единица наблюдения

Ключевой release-level target — **employee-period**, а не независимый отдельный звонок.

Это означает:

```text
single call → preliminary speech/acoustic signal
series of calls / employee-period → relative period-level risk
```

Поэтому нельзя интерпретировать call-level score как подтверждённое «выгорание = да/нет».

### Reference bands

Текущие reference bands основаны на TRAIN employee-periods и являются временной **relative reference**, а не нормативной популяционной шкалой.

Некорректно называть 25 TRAIN periods «нормой населения» или «клинической нормой».

## 4. Grouping / leakage principles

Для задач, где один человек имеет несколько звонков, validation должна учитывать identity grouping.

Почему это важно:

- один и тот же голос может появляться многократно;
- случайный call-level split способен завысить качество;
- задача deployment — перенос на сотрудника/период, а не узнавание конкретного голоса.

Поэтому employee-grouped / leave-person-out логика является более сильным evidence, чем случайное разбиение звонков.

## 5. CONTROL и model selection

Правило проекта:

> CONTROL не используется для post-hoc выбора модели или порога, если он заявляется как независимая проверка.

Если анализ CONTROL породил новую гипотезу, она становится новым экспериментом/версией и требует отдельной validation.

## 6. Public-safe scope

Публично можно хранить:

- aggregate sample counts;
- class counts;
- grouping semantics;
- analysis horizon;
- label availability;
- quality exclusions в агрегированном виде;
- protocol description.

Не публикуются по умолчанию:

- исходные банковские файлы;
- filenames/call IDs/operator IDs;
- реальные transcripts;
- row-level labels/predictions;
- private feature tables;
- splits с идентифицирующими ключами.

## 7. Связанные документы

- [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md)
- [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md)
- [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md)
- [QUALITY_AND_EVIDENCE.md](QUALITY_AND_EVIDENCE.md)
- [EXPERT_REVIEW_AND_VALIDATION.md](EXPERT_REVIEW_AND_VALIDATION.md)

## 8. Итог

Главный принцип интерпретации:

```text
metric
+ unit of observation
+ label availability
+ grouping rule
+ horizon
+ quality/evidence rule
```

только вместе образуют содержательный validation claim.