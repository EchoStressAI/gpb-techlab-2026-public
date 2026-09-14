# Validation Protocol

## 1. Цель

Этот документ фиксирует, **какие виды проверки нужны**, чтобы не смешивать техническую работоспособность, модельное качество и экспертную объяснимость.

Публичный CI подтверждает integration contract. ML-метрики требуют отдельного validation protocol.

## 2. Критерии заказчика

В техническом задании GPB TechLab для CASE 1 основной метрикой указана **PR AUC**, а ROC AUC — дополнительной. Для CASE 2 целевой критерий — **ROC AUC не ниже 0.75**; отдельно оценивается прозрачность/доступность объяснений не ниже 80%.

Эти значения являются **критериями оценки**, а не автоматически подтверждёнными метриками любой версии runtime.

## 3. CASE 1

### Основная метрика

PR AUC — особенно важна при дисбалансе классов.

### Дополнительные показатели

- ROC AUC;
- Precision/Recall на зафиксированном operating point;
- error rates;
- доля `INSUFFICIENT_EVIDENCE`;
- performance отдельно по достаточному/ограниченному input quality.

### Важное правило

Порог нельзя подбирать на том же наборе, который затем объявляется независимой проверкой.

Если используется cascade, каждая стадия должна иметь отдельный понятный contract и validation role.

## 4. CASE 2

### Основная метрика

ROC AUC на заранее определённом validation/test protocol.

### Дополнительные показатели

- operator-balanced metrics;
- within-person/within-transition analysis;
- quality-conditioned performance;
- stability by employee/domain;
- explainability acceptance.

### Почему одной ROC AUC недостаточно

Высокая pooled ROC AUC может сосуществовать с плохим переносом между людьми. Поэтому полезно отдельно смотреть:

- межличностное разделение;
- ранжирование изменений внутри одного человека;
- устойчивость по отдельным сотрудникам;
- влияние speech coverage.

## 5. Expert review protocol

Экспертная рецензия должна быть отделена от банковской validation label.

Рекомендуемая последовательность:

1. зафиксировать экспертную подвыборку;
2. зафиксировать модель/порог;
3. получить сопоставление;
4. отдельно разобрать agreement/disagreement;
5. не менять модель задним числом в рамках той же проверки;
6. новые гипотезы проверять уже новым experiment id/protocol.

## 6. Full-record vs model-window mismatch

Если эксперт оценивал полный звонок, а runtime — первые 60/180 секунд, это **неэквивалентные наблюдения**.

В validation report должно быть указано:

- какое окно видел runtime;
- какую часть видел эксперт;
- сколько релевантной речи реально попало в модель;
- не находится ли ключевой экспертный эпизод за пределами model horizon.

## 7. Explainability acceptance

Объяснимость желательно проверять не только технической XAI-формулой, но и human acceptance protocol.

Пример критериев рецензента:

- понятно, что означает итог;
- понятно, какие факторы повлияли;
- видно качество/ограничения;
- объяснение не выдаёт технический класс за диагноз;
- пользователь понимает следующий шаг.

Формат опросника и выбор кейсов должны быть зафиксированы до просмотра ответов.

## 8. Negative results

Отрицательные результаты не удаляются из research history. Если гипотеза не улучшила основной protocol, она должна быть помечена как rejected/experimental, а не незаметно исчезать.

Это защищает от повторения уже проверенных веток и от selection bias.

## 9. Version identity

Любая опубликованная метрика должна сопровождаться:

```text
case
model_id
preprocessing/runtime version
validation split/protocol
metric definition
sample size
analysis horizon
quality inclusion rules
calculation date
```

Без этого число трудно интерпретировать и воспроизвести.

## 10. Что CI не проверяет

GitHub Actions public repo не проверяет:

- реальную банковскую PR AUC/ROC AUC;
- экспертные labels;
- качество private model weights;
- производительность на закрытых данных.

Он проверяет API, contracts, errors и integration behavior.

## 11. Recommended report structure

Для каждой финальной runtime-версии хранить отдельный validation report:

1. Scope.
2. Dataset roles.
3. Leakage controls.
4. Model id.
5. Metrics.
6. Confidence intervals/uncertainty, если применимо.
7. Quality stratification.
8. Error analysis.
9. Expert review.
10. Known limitations.
11. Release decision.

## 12. Главное правило

**Нельзя улучшать историю задним числом.** Если анализ CONTROL породил новую идею, это новый эксперимент и новая версия, а исходный validation result сохраняется неизменным.
