# Model Validation Report Template

> Этот шаблон заполняется для конкретной frozen model/runtime версии. Он не должен содержать банковские row-level predictions, реальные transcripts или персональные identifiers в публичной копии.

## 1. Identity

```text
Case:
Model ID:
Runtime build:
Public repo commit/tag:
Preprocessing version:
Calculation date:
Owner/reviewer:
```

## 2. Intended claim

Что именно проверяется:

- целевой construct;
- unit of observation;
- анализируемая роль;
- analysis horizon;
- deployment use case.

## 3. Dataset roles

```text
TRAIN:
VALIDATION:
TEST / HOLDOUT:
CONTROL:
EXTERNAL:
```

Для каждого набора указать только допустимые aggregate counts и label availability.

## 4. Split / grouping rule

Зафиксировать:

- random / grouped / leave-person-out / temporal split;
- какой identifier используется для grouping;
- почему этот split соответствует deployment question;
- какие leakage controls применены.

## 5. Inclusion / exclusion rules

До расчёта метрик зафиксировать:

- minimum evidence/speech coverage;
- invalid audio rule;
- role/channel rule;
- missing-data handling;
- `INSUFFICIENT_EVIDENCE` treatment.

## 6. Primary metric

```text
Metric:
Value:
Confidence interval / uncertainty:
Sample size:
```

## 7. Secondary metrics

| Metric | Value | Notes |
|---|---:|---|
| PR AUC | | |
| ROC AUC | | |
| Weighted F1 | | |
| Precision | | |
| Recall | | |
| Other | | |

Не заполнять неприменимые метрики ради полноты таблицы.

## 8. Operating point

Если используется threshold/cascade:

```text
Selection dataset:
Threshold selection rule:
Frozen before holdout: yes/no
Precision:
Recall:
Coverage:
Abstain/insufficient rate:
```

Публичная версия может не раскрывать exact threshold, если это model IP; тогда threshold identity фиксируется version/hash.

## 9. Quality-conditioned results

Проверить отдельно, если возможно:

- sufficient vs limited evidence;
- speech coverage strata;
- channel/audio quality;
- relevant demographic/domain strata только если это допустимо и sample достаточен.

## 10. Shortcut / leakage audit

Перечислить проверенные риски:

```text
speaker identity
operator/workflow
filename/metadata
recording period/year
channel properties
post-horizon information
duplicate/near-duplicate data
```

Для найденного shortcut описать, почему он не используется в финальном production claim.

## 11. Error analysis

Агрегированно описать:

- false positives;
- false negatives;
- insufficient evidence;
- construct mismatch;
- temporal mismatch;
- quality-related failures.

Без публикации идентифицируемых bank examples.

## 12. Expert / semantic review

```text
Protocol:
Sample size:
What expert saw:
What model saw:
Agreement metrics:
Main disagreement classes:
```

Не называть expert review ground truth, если это не подтверждено protocol.

## 13. Calibration / score semantics

Отметить одно:

```text
[ ] calibrated probability
[ ] ranking/relative score
[ ] margin/logit-like score
[ ] other
```

Если score не calibrated probability, запрещено переводить его в «X% вероятность состояния».

## 14. Comparison / ablation

Только заранее определённые или clearly labeled research comparisons:

| Branch | Primary metric | Complexity | Decision |
|---|---:|---|---|
| | | | |

## 15. Known limitations

Минимально:

- dataset size/domain;
- unit of observation;
- generalization;
- temporal scope;
- quality sensitivity;
- missing external validation;
- human acceptance status.

## 16. Release decision

```text
[ ] ACCEPT for stated scope
[ ] ACCEPT WITH LIMITATIONS
[ ] RESEARCH ONLY
[ ] REJECT
```

Причина:

## 17. Public claim approved

Одним абзацем записать **точную внешнюю формулировку**, которую можно использовать в README/презентации.

## 18. Claims explicitly prohibited

Список формулировок, которые эта validation **не подтверждает**.

## 19. Sign-off

```text
Model owner:
Technical reviewer:
Scientific/domain reviewer:
Date:
```
