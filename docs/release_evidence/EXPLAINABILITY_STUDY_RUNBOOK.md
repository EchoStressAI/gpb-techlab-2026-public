# Human Explainability Study Runbook · CASE 2

Этот документ превращает frozen HR-criterion из формы в воспроизводимую процедуру проведения исследования. Он **не меняет** acceptance rule и не вводит новый минимальный sample size.

## 1. Что именно проверяется

Исследование отвечает только на вопрос:

> Понятно ли HR/экспертному пользователю product explanation и достаточно ли его, чтобы понять необходимость дополнительной проверки/мониторинга?

Оно **не** является:

- повторной ML-валидацией;
- проверкой ground-truth burnout label;
- медицинской валидацией;
- оценкой пригодности автоматических кадровых решений;
- доказательством причинности акустических факторов.

Основной frozen criterion остаётся неизменным:

```text
accepted respondent-case rating = Q2 >= 4 AND Q3 >= 4
Explainability Acceptance Rate = accepted / valid ratings
PASS = rate >= 0.80
```

## 2. Сначала заморозить версию объяснения

До первого ответа reviewer зафиксировать один study snapshot:

```text
study_id
release_id
CASE 2 model_id = CASE2_OPEN_ACOUSTIC11_ORIENTED_V1
frontend build / public UI version
public explanation contract version
study start date
```

Если после начала исследования materially меняются тексты факторов, quality note, next step, safety note или способ отображения, старые и новые ответы нельзя молча смешивать как одну неизменную версию. Для новой версии создаётся новый `study_id` либо отчёт явно разделяется по версиям.

## 3. Подготовить безопасный case pack

Для каждого explanation case создать безопасный ID вида:

```text
EXP-001
EXP-002
...
```

Reviewer не должен видеть:

- реальное банковское имя файла;
- employee/operator ID;
- raw transcript;
- row-level ground truth;
- exact Acoustic11 feature IDs;
- численные contributions/coefficients/thresholds;
- private provenance/model paths;
- training/CONTROL metadata.

Для explainability review достаточно customer-facing карточки:

```text
relative risk/state signal
risk band / reference percentile when available
broad human-readable factors
quality/history limitation
next step
safety note
```

Case pack может включать разные **наблюдаемые продуктовые ситуации**, например sufficient evidence, limited history или insufficient evidence. Это рекомендация по покрытию интерфейсных состояний, а не новый статистический quota/acceptance rule.

Структура case-pack metadata находится в `EXPLAINABILITY_CASE_PACK_TEMPLATE.csv`.

## 4. Не показывать ground truth до оценки

Reviewer оценивает только понятность product explanation.

До заполнения Q1–Q4 нельзя сообщать:

- внутреннюю метку;
- мнение исследовательской команды о «правильном» ответе;
- то, считается ли case лёгким/сложным;
- ожидаемую оценку reviewer.

Если ground truth вообще существует и нужен для отдельного анализа, он хранится отдельно и соединяется с HR responses только после завершения рейтинга.

## 5. Единая инструкция всем reviewer

Каждому reviewer дать одинаковую форму:

[EXPLAINABILITY_REVIEWER_FORM.md](EXPLAINABILITY_REVIEWER_FORM.md)

Порядок действий:

1. показать одну customer-safe explanation card;
2. reviewer самостоятельно читает результат, факторы, quality/history limitation, next step и safety note;
3. reviewer заполняет Q1–Q4 по шкале 1–5;
4. опционально оставляет свободный комментарий;
5. перейти к следующему case.

Не объяснять смысл карточки своими словами до ответа: иначе исследование будет измерять понятность объяснения исследователя, а не интерфейса.

## 6. Идентификаторы и порядок

`respondent_id` — только псевдонимизированный код, например `HR-01`.

`explanation_case_id` — только безопасный case ID, например `EXP-003`.

Если cases показываются в разном порядке, порядок можно рандомизировать для снижения order effect. Это не обязательное условие frozen criterion; если используется, метод/seed фиксируется во внутреннем study log.

## 7. Сбор ответов

Итоговый CSV должен соответствовать:

`EXPLAINABILITY_ACCEPTANCE_TEMPLATE.csv`

Обязательные поля:

```text
respondent_id
explanation_case_id
case_id
q1_result_clarity
q2_feature_clarity
q3_actionability
q4_safety_clarity
comments
```

Правила данных:

- Q1–Q4 — целые значения 1..5;
- `case_id` для текущего HR criterion = `CASE_2`;
- одна строка = одна пара respondent × explanation case;
- не дублировать одну и ту же пару как две независимые оценки;
- пропущенные/некорректные ratings не превращать в нули.

## 8. Подсчёт

```bash
python scripts/score_explainability_acceptance.py responses.csv \
  --target 0.80 \
  --output docs/release_evidence/explainability_acceptance_summary.json
```

Основной PASS определяется **только** frozen rule `Q2>=4 AND Q3>=4` и общим threshold `0.80`.

Дополнительно отчёт показывает:

- Q1/Q2/Q3/Q4 rate `>=4`;
- mean/median;
- число уникальных respondents;
- число explanation cases;
- число валидных respondent-case ratings;
- Wilson 95% CI основного acceptance rate.

ТЗ не задаёт обязательное минимальное число reviewer/cases. Поэтому маленькая выборка не превращается автоматически в FAIL, но должна быть явно указана как ограничение доказательства.

## 9. Что считать валидным evidence

Для release evidence сохранить:

```text
study_id
release_id
model_id
UI/explanation snapshot identity
study dates
number of unique respondents
number of explanation cases
number of valid ratings
acceptance rate
Wilson 95% CI
Q1/Q2/Q3/Q4 summaries
PASS/FAIL against 0.80
limitations
```

Public copy не должна содержать ФИО reviewer, банковские IDs, filenames, transcripts или row-level model outputs.

## 10. Что делать с обратной связью

Свободные комментарии можно использовать для следующей версии UX/explanation.

Но если после просмотра первых ratings интерфейс меняется, нельзя считать последующие ответы продолжением того же неизменного acceptance run без version split. Корректный цикл:

```text
freeze explanation v1
→ study v1
→ analyze feedback
→ change explanation
→ freeze v2
→ new study / clearly separated v2 ratings
```

Так criterion остаётся проверкой конкретной версии продукта, а не результатом post-hoc подгонки объяснений по тем же оценкам.
