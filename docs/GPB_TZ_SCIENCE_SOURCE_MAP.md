# Научные источники из ТЗ Газпромбанка: карта применимости

В техническом задании Газпромбанка приведены четыре научных источника. Этот документ показывает, **что именно каждый источник поддерживает**, а чего из него выводить нельзя.

Это важно, потому что близкие термины `stress`, `emotion`, `voice` и `speech` могут относиться к разным научным конструкциям.

## 1. Рафикова, Валуева, Панфилова · 2022

**Рафикова А. С., Валуева Е. А., Панфилова А. С.** Голос и психологические свойства человека: обзор современных исследований // Психология. Журнал Высшей школы экономики. 2022. Т. 19. № 1. С. 195–215. DOI: `10.17323/1813-8918-2022-1-195-215`.

Источник из ТЗ:

`https://psy-journal.hse.ru/data/2022/04/06/1802762736/19-01-195-215.pdf`

### Что поддерживает

Обзор систематизирует связь акустических и просодических характеристик речи с психологическими/эмоциональными свойствами и описывает типичные измеряемые параметры:

- fundamental frequency / pitch;
- intensity;
- speech rate;
- jitter / shimmer;
- HNR;
- MFCC;
- временные характеристики речи и пауз;
- valence / activation как измерения эмоционального representation.

### Как используется в EchoStressAI

Источник поддерживает **общую научную обоснованность анализа акустико-речевых характеристик**, но не доказывает, что любой отдельный признак однозначно определяет выгорание или внешнее воздействие мошенника.

### Ограничение

Сам обзор подчёркивает необходимость теоретического осмысления эмпирических связей. Поэтому в EchoStressAI feature contribution не трактуется автоматически как психологическая причина.

---

## 2. Kappen et al. · Scientific Reports · 2022

**Kappen M., van der Donckt J., Vanhollebeke G. et al.** *Acoustic speech features in social comparison: how stress impacts the way you sound.* Scientific Reports. 2022;12:22022. DOI: `10.1038/s41598-022-26375-9`.

Источник из ТЗ:

`https://www.nature.com/articles/s41598-022-26375-9.pdf`

### Что поддерживает

Исследование использует контролируемую within-subject стресс-индукцию с физиологическим и self-report подтверждением реакции и анализирует acoustic speech features.

В работе наблюдались изменения ряда голосовых характеристик, включая F0, HNR и shimmer.

### Как используется в EchoStressAI

Это важная опора для тезиса:

> акустические характеристики речи могут содержать измеримый signal, связанный с психофизиологической стрессовой реакцией.

### Ограничение

Исследование посвящено **acute psychosocial stress**, а не профессиональному выгоранию и не мошенническому воздействию. Поэтому оно поддерживает acoustic/state layer, но не является прямой validation целевых банковских labels.

---

## 3. Kappen et al. · Scientific Reports · 2024

**Kappen M., Vanhollebeke G., Van Der Donckt J. et al.** *Acoustic and prosodic speech features reflect physiological stress but not isolated negative affect: a multi-paradigm study on psychosocial stressors.* Scientific Reports. 2024;14:5515. DOI: `10.1038/s41598-024-55550-3`.

Источник из ТЗ:

`https://www.nature.com/articles/s41598-024-55550-3.pdf`

### Что поддерживает

Работа особенно важна для EchoStressAI, потому что показывает различие между:

```text
physiological stress response
и
isolated negative affect
```

В multi-paradigm design acoustic/prosodic изменения лучше соответствовали условию, где присутствовала физиологически подтверждённая stress response, чем ситуации с одним только ростом negative affect.

### Как используется в EchoStressAI

Это напрямую поддерживает наше архитектурное решение **не отождествлять негативную эмоцию со стрессом/истощением/выгоранием**.

Именно поэтому:

- emotion representation рассматривается как supporting layer;
- CASE 2 PRIMARY не строится как простое переименование negative emotion в burnout;
- экспертный review отдельно анализирует construct mismatch.

### Ограничение

Даже этот источник не устанавливает универсальный диагностический threshold для банковского сотрудника. Нужна task-specific validation на целевой population/domain.

---

## 4. Mousikou, Strycharczuk, Rastle · Journal of Memory and Language · 2024

**Mousikou P., Strycharczuk P., Rastle K.** *Acoustic correlates of stress in speech perception.* Journal of Memory and Language. 2024;136:104509. DOI: `10.1016/j.jml.2024.104509`.

Источник из ТЗ:

`https://www.sciencedirect.com/science/article/pii/S0749596X24000123`

### Важное терминологическое различие

В этой статье слово **stress** означает прежде всего **word stress / лексическое ударение**, а не психологический или физиологический стресс человека.

Работа исследует, как duration, pitch и intensity влияют на восприятие ударения в словах.

### Что источник действительно поддерживает

Он подтверждает, что:

- duration;
- pitch;
- intensity;

являются значимыми акустическими cues речевого сигнала и могут взаимодействовать между собой.

### Чего из него нельзя выводить

Некорректно ссылаться на эту статью как на доказательство того, что:

- голос диагностирует психологический стресс;
- pitch/intensity напрямую означают выгорание;
- акустическое ударение является biomarker неблагоприятного состояния.

### Почему всё равно полезно учитывать

Источник полезен для **speech/acoustic methodology**, но не для construct validity психологического stress/burnout layer.

Это различие следует сохранять в презентации и документации.

---

# 5. Как источники ТЗ связываются с архитектурой

| Научный тезис | Поддержка | Использование в решении |
|---|---|---|
| Голос содержит объективно измеряемые acoustic/prosodic признаки | Рафикова et al.; обе работы Kappen; Mousikou et al. | acoustic feature extraction / representations |
| Психофизиологический stress может отражаться в речи | Kappen 2022; Kappen 2024 | supporting state / scientific rationale |
| Negative affect нельзя автоматически считать physiological stress | Kappen 2024 | construct separation |
| Pitch/intensity/duration — содержательные акустические cues | Рафикова et al.; Mousikou et al. | feature-family semantics |
| Голос сам по себе доказывает burnout | **не подтверждается этими источниками** | требуется собственная CASE 2 validation |
| Голос сам по себе доказывает влияние мошенника | **не подтверждается этими источниками** | требуется собственная CASE 1 validation |

## 6. Почему собственная validation обязательна

Научная литература отвечает на вопрос:

> «Есть ли основания искать signal в речи?»

Но конкурсная validation отвечает на другой вопрос:

> «Работает ли конкретная frozen модель EchoStressAI на конкретной банковской задаче, с заданным horizon и unit of observation?»

Поэтому literature rationale и model metrics не подменяют друг друга.

## 7. Научная цепочка аргумента

Корректная логика EchoStressAI:

```text
научные исследования
→ обоснованные семейства наблюдаемых сигналов
→ task-specific hypothesis
→ банковские данные
→ leakage-aware validation
→ error / construct analysis
→ frozen serving model
```

Некорректная логика:

```text
«статья нашла связь pitch со stress»
→
«значит высокий pitch = выгорание»
```

## 8. Практический вывод

Источники, предложенные самим заказчиком, хорошо поддерживают общий подход к acoustic speech analysis. При этом их внимательное чтение усиливает осторожную методологию проекта:

- разделять acoustic observation и psychological interpretation;
- разделять negative affect и physiological stress;
- не переносить результаты acute-stress экспериментов напрямую на burnout;
- не путать lexical word stress с psychological stress;
- подтверждать целевые банковские claims собственной validation.

Это соответствует принципу EchoStressAI: **наблюдаемый речевой signal → проверяемая task-specific модель → ограниченная, объяснимая интерпретация**.