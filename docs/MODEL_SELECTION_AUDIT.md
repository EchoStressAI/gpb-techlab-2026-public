# Model Selection Audit · CASE 1 / CASE 2

Этот документ объясняет **почему финальные PRIMARY-модели выбраны именно такими**, включая сильные, но отвергнутые ветки. Он публикует только безопасные aggregate results и не раскрывает feature coefficients, exact thresholds, model weights или proprietary formulas.

## 1. Почему нужен model-selection audit

Высокая метрика сама по себе не гарантирует полезную модель. Она может появиться из-за:

- procedural/workflow shortcut;
- утечки identity;
- слишком удобного split;
- сигнала, который не соответствует целевому construct;
- сложности, которая почти не улучшает качество, но резко ухудшает deployment.

Поэтому в проекте фиксируется не только победившая модель, но и **почему альтернативы были отклонены**.

---

# CASE 1

## 2. Сильный operator/workflow signal

На ранних экспериментах operator-side signal дал очень высокую PR AUC — порядка `0.94`.

Это не было принято как финальный клиентский результат, потому что анализ показал сильную зависимость от workflow/operator process.

Правильный вывод:

> высокий operator-side score показал наличие информации в процедуре разговора, но не доказал переносимый CLIENT-only biomarker внешнего воздействия.

Поэтому operator-only result не публикуется как production/client claim.

## 3. Shortcut-resistant stress-test

Для проверки устойчивости была построена более защищённая workflow-aware/strict validation ветка.

Aggregate result:

```text
PR AUC  = 0.4901
ROC AUC = 0.8648
```

Эта ветка полезна как **robustness reference**, но не заменяет CLIENT-only PRIMARY.

## 4. Bank-safe CLIENT-only PRIMARY

Финальный публичный PRIMARY ограничен клиентским материалом и ранним окном.

Aggregate frozen result:

```text
PR AUC     = 0.3654
ROC AUC    = 0.7569
Weighted F1 = 0.8190
```

Эти цифры ниже красивого operator-only результата, но лучше соответствуют тому, **что система должна измерять у клиента**, а не процедуру работы оператора.

## 5. Evidence Gate

Отдельный результат model-selection процесса — введение `insufficient evidence`.

В labeled exact60 subset:

```text
22 / 209 → insufficient evidence
6 из них positive
```

Следствие:

> отсутствие достаточной клиентской речи нельзя автоматически считать отрицательным классом.

Evidence Gate является частью безопасной serving semantics, а не косметическим UI warning.

## 6. Privileged-learning R&D branch

Отдельная исследовательская ветка проверяла идею использовать operator/context information **offline как privileged teacher**, не подавая operator features в финальный CLIENT student inference.

На HOLDOUT89 исследовательский режим дал:

```text
CLIENT baseline: PR 0.3808 / ROC 0.7171
R&D privileged-learning: PR 0.7277 / ROC 0.9286
```

Это сильный R&D result, но он остаётся **batch/research claim**, а не текущим bank-safe production claim.

Важно: нельзя формулировать это как «LUPI вообще не использует оператора». Operator information может участвовать на training/teacher stage; отличие в том, что он не входит в финальный CLIENT-only student feature vector.

## 7. Итог CASE 1

Model selection выбрал более слабую по headline PR AUC, но более корректную и bank-safe PRIMARY-ветку.

```text
не самая большая метрика
→ зато правильный объект анализа
→ меньше shortcut risk
→ явная sufficiency gate
→ честная product semantics
```

---

# CASE 2

## 8. Acoustic vs text vs fusion

Для финального CASE 2 сравнивались три ключевые ветки:

```text
TEXT4      ROC AUC = 0.6948
ACOUSTIC11 ROC AUC = 0.8701
FUSION15   ROC AUC = 0.8766
```

Fusion улучшал ROC AUC примерно на:

```text
+0.0065
```

При этом fusion требовал дополнительного ASR/text serving path и усложнял production contract.

## 9. Почему выбран Acoustic11

Acoustic11 был выбран как PRIMARY, потому что:

- существенно сильнее TEXT4;
- почти не уступает FUSION15;
- проще для on-prem deployment;
- не зависит от отдельного ASR/text path в PRIMARY;
- легче объясняется на уровне акустических feature families;
- снижает число failure modes.

Это пример model selection по **quality × simplicity × explainability × deployment**, а не только по максимальному числу метрики.

## 10. Frozen CASE 2 result

Финальная frozen model identity:

```text
CASE2_OPEN_ACOUSTIC11_ORIENTED_V1
```

Aggregate validation snapshot:

```text
Period ROC AUC        = 0.8701
Period PR AUC         = 0.8060
Operator-equal ROC    ≈ 0.882
Orientation stability = 11/11
```

## 11. Важный caveat: within-person dynamics

Средний within-transition AUC:

```text
0.4375
```

Это ограничение нельзя скрывать за сильной period-level ROC AUC.

Корректная интерпретация:

- модель хорошо разделяет employee-period risk в текущем protocol;
- это **не означает**, что она уже надёжно отслеживает каждое изменение внутри одного человека во времени;
- longitudinal claim требует отдельной validation.

## 12. Reference bands

Reference bands основаны на текущих TRAIN employee-periods и являются относительным reference для конкурса.

Их нельзя называть:

- клинической нормой;
- популяционной нормой;
- универсальным порогом выгорания.

## 13. CONTROL

CONTROL не использовался для выбора Acoustic11 как PRIMARY.

CONTROL output может использоваться для демонстрации reproducible inference/ranking, но без независимых labels нельзя превращать его в новый AUC claim.

## 14. Итог CASE 2

```text
TEXT4 слишком слаб
FUSION15 почти не улучшает Acoustic11
→ выбран Acoustic11
```

Это сознательное упрощение production path при сохранении основного validated quality.

---

# 15. Общий принцип отбора

В обоих кейсах использован один и тот же принцип:

```text
не максимизировать headline metric любой ценой
а искать сигнал, который:
- относится к правильному объекту
- устойчив к shortcut/leakage
- объясним
- deployable
- имеет явные ограничения
```

Это и есть причина, почему public PRIMARY может отличаться от самой высокой метрики в исследовательском журнале.