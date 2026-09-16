# Explainability Acceptance Report Template

## 1. Identity

```text
Report ID:
Date:
Public repo commit/tag:
Frontend version:
CASE 2 model_id:
Protocol version:
```

## 2. Goal

Проверить критерий ТЗ:

```text
прозрачность и доступность объяснений >= 80%
```

по заранее зафиксированному human-acceptance protocol.

## 3. Reviewers

Публично хранится только агрегированная информация.

| Reviewer role | N |
|---|---:|
| HR / people specialist | |
| Contact-center supervisor | |
| Bank/domain specialist | |
| Psychology/psychophysiology expert | |
| Other | |

Total reviewers:

## 4. Cases

```text
Number of distinct cases:
Normal/low signal:
Elevated signal:
Limited evidence:
Low speech coverage:
History/period context:
Other:
```

Набор зафиксирован до просмотра ответов: `yes/no`.

## 5. Assessments

```text
Planned reviewer-case pairs:
Valid assessments:
Excluded assessments:
```

### Exclusion reasons

| Reason | N |
|---|---:|
| Technical UI failure | |
| Incomplete form | |
| Wrong release/case | |
| Other pre-registered reason | |

Низкая оценка explanation не является причиной exclusion.

## 6. Questions

### Q1
Понятен смысл результата и то, что он не является автоматически probability/diagnosis?

### Q2
Понятны типы речевых факторов, связанных с результатом?

### Q3
Видны ли quality/evidence limitations?

### Q4
Понятен ли следующий human-in-the-loop action?

### Q5
Выбрана ли корректная интерпретация: «дополнительный model signal, требующий контекста»?

## 7. Scoring

```text
Q1-Q4: Да=1; Частично=0.5; Нет=0
Q5: correct=1; incorrect=0

per-pair score = mean(Q1..Q5)
understood = score >= 0.8 AND Q5 == 1

main metric = understood valid pairs / all valid pairs
```

## 8. Main result

```text
Understood pairs:
Valid pairs:
Explainability acceptance:
Threshold: 0.80
PASS/FAIL:
```

## 9. Per-question results

| Question | Full yes/correct | Partial | No/incorrect | Mean |
|---|---:|---:|---:|---:|
| Q1 | | | | |
| Q2 | | | | |
| Q3 | | | | |
| Q4 | | | | |
| Q5 | | n/a | | |

## 10. By reviewer role

| Role | N assessments | Acceptance |
|---|---:|---:|
| | | |

## 11. By case type

| Case type | N assessments | Acceptance |
|---|---:|---:|
| Normal/low | | |
| Elevated | | |
| Limited evidence | | |
| Low speech coverage | | |
| History/period | | |

## 12. Failure categories

Агрегированно описать, что было непонятно:

- score semantics;
- probability/diagnosis confusion;
- feature explanation;
- quality warning;
- next action;
- terminology;
- visual hierarchy.

## 13. Changes after test

Если UI/wording изменяется после human test, исходный result не переписывается.

Новая версия требует:

```text
new frontend commit
new protocol run id
new acceptance result
```

## 14. Limitations

Указать:

- sample size;
- reviewer composition;
- representativeness;
- demo vs production UI differences;
- whether real or synthetic/safe cases were used.

## 15. Public-safe claim

Если PASS:

> «В human-acceptance evaluation [N] валидных reviewer-case assessments доля объяснений, удовлетворивших заранее заданному критерию понятности, составила [X%]».

Если FAIL/insufficient sample — не заявлять ≥80%.

## 16. Sign-off

```text
Product owner:
Scientific/domain reviewer:
UX/research reviewer:
Date:
```
