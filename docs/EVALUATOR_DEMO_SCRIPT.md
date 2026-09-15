# Evaluator Demo Script · 10–12 минут

Этот сценарий предназначен для демонстрации **публичной конкурсной версии**. Он должен совпадать с тем, что реально показывает public frontend, и не требовать внутренних research/debug панелей.

## 0. До начала

Зафиксировать release identity:

```text
public repo commit/tag
frontend version
CASE 1 model_id
CASE 2 model_id
runtime build
container/image identity
```

Проверить:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -i http://127.0.0.1:8080/api/v1/readiness
```

Если runtime не ready, не подменять live inference prerecorded result без явной пометки.

## 1. 30 секунд · что решаем

Показать два сценария:

```text
CASE 1 · клиент · первые 60 сек · дополнительный риск-сигнал внешнего воздействия
CASE 2 · сотрудник · первые 180 сек · относительный employee-period/state risk signal
```

Ключевая формулировка:

> Система даёт дополнительный model signal и ограничения его интерпретации, а не автономный диагноз или юридический вывод.

## 2. 60 секунд · архитектура

Показать:

```text
Frontend
→ Public Integration API
→ case routing / contract validation
→ local CASE 1 / CASE 2 runtime
→ PRIMARY + public-safe quality/evidence semantics
```

Подчеркнуть:

- on-prem-ready;
- no mandatory external cloud inference;
- no fake score when runtime unavailable;
- public repo не содержит банковские данные/weights.

## 3. 2 минуты · CASE 1 обычный пример

Загрузить безопасный demo-файл CASE 1.

На **public UI** показать только то, что реально доступно в публичной projection:

1. выбран CASE 1;
2. окно `0–60 сек`;
3. PRIMARY result / decision status;
4. `primary_score`, если система не abstain;
5. `evidence_status`;
6. `model_id`;
7. public-safe словесную интерпретацию;
8. transcript — только если у пользователя есть соответствующее право и demo-data безопасны.

Формулировка:

> Score — ранговый модельный сигнал. Это не вероятность воздействия, если calibration отдельно не доказана.

Не говорить:

- «вероятность мошенничества X%»;
- «модель доказала воздействие»;
- «operator workflow подтверждает состояние клиента».

## 4. 1 минута · CASE 1 insufficient evidence

Показать заранее подготовленный безопасный пример, где client evidence недостаточно.

Ожидаемый public outcome:

```text
INSUFFICIENT_EVIDENCE / limited evidence
```

Объяснить:

> Отсутствие достаточного наблюдения не превращается автоматически в «низкий риск».

Это ключевой safety-механизм CASE 1.

## 5. 2 минуты · CASE 2

Загрузить безопасный demo-файл CASE 2.

На **public UI** показать:

1. окно `0–180 сек`;
2. relative `risk_score` / `risk_band`;
3. `model_id`;
4. validated unit / employee-period semantics;
5. reference percentile, если он доступен в runtime contract;
6. публичную оговорку: score — относительный index, а не probability/diagnosis.

Public frontend намеренно **не показывает** exact internal feature names, numeric feature contributions, thresholds, imputed-feature lists, anxiety formula и research-only supporting outputs. Поэтому demo не должен обещать эти элементы на публичном экране.

Если на закрытом внутреннем стенде есть richer XAI/supporting view, его нужно явно называть **private/internal product view**, а не выдавать за содержимое public repo.

## 6. 1 минута · history / period semantics

Если текущий public snapshot действительно содержит employee history и connected runtime отдаёт её корректно:

- показать chronology;
- подчеркнуть, что одна строка не равна диагнозу;
- не использовать будущие звонки для объяснения прошлого результата.

Если history в конкретном release snapshot не готова end-to-end — блок пропустить. Не имитировать production history synthetic данными без явной маркировки.

## 7. 1 минута · почему CASE 2 acoustic-first

Короткая формулировка:

> Мы сравнили acoustic, text и fusion. Fusion дал только небольшой прирост относительно Acoustic11 при дополнительной ASR/text complexity, поэтому PRIMARY оставили acoustic-first.

Это model-selection argument, а не утверждение, что текст в принципе бесполезен.

## 8. 1 минута · validation

Показать aggregate results с правильной семантикой.

### CASE 1

```text
PR AUC       0.3654
ROC AUC      0.7569
Weighted F1  0.8190
```

Отдельно сказать, что более высокий operator-side result был отвергнут как финальный client claim после workflow-shortcut audit.

### CASE 2

```text
Period ROC AUC          0.8701
Period PR AUC           0.8060
Operator-equal ROC AUC  ~0.882
```

Обязательно добавить: это current competition/internal validation snapshot; within-person transition quality слабее, и внешний release claim требует дополнительной validation.

Критерий explainability ≥80% — отдельный **human-acceptance** criterion. Наличие XAI-технологии или документации само по себе его не закрывает.

## 9. 30 секунд · fail-closed

Если позволяет время, показать технический boundary:

- runtime unavailable;
- readiness = not ready;
- API не генерирует fake score.

## 10. 30 секунд · финал

> EchoStressAI объединяет два банковских сценария в on-prem-ready контур с фиксированными ранними окнами, versioned PRIMARY, evidence/quality semantics и human-in-the-loop. Мы отдельно проверяем не только метрику, но и происхождение сигнала, чтобы не выдавать workflow shortcut или эмоциональный proxy за целевой риск.

## 11. Что подготовить заранее

- 1 безопасный CASE 1 demo;
- 1 CASE 1 insufficient-evidence demo;
- 1 безопасный CASE 2 demo;
- history example — только если он реально входит в release snapshot;
- release/model IDs;
- public validation summary;
- prerecorded fallback с явной маркировкой `recorded`;
- локальный Docker/runtime snapshot.

## 12. Что не должно находиться в public demo bundle

- реальные банковские аудио без отдельного разрешения;
- реальные персональные transcripts;
- row-level validation predictions;
- internal feature tables;
- exact model coefficients/thresholds;
- model weights, если их публикация не разрешена;
- passwords/tokens;
- production hostnames/IPs, не предназначенные для публикации.

## 13. Вопросы, к которым быть готовыми

- Почему PR AUC CASE 1 ниже ROC AUC?
- Почему operator-only сильный signal не стал PRIMARY?
- Почему CASE 2 acoustic-first?
- Почему 0.87 не называется финальной внешней production validation?
- Как отдельно измеряется explainability ≥80%?
- Где measured evidence для 1×A100 и latency?
- Почему weights нет в public Git?
- Как обеспечивается on-prem?
- Почему один звонок не равен burnout diagnosis?

Ответы должны совпадать с Model Cards, Public Claims Register, Validation Protocol и FAQ.

## 14. Demo pass rule

Demo считается содержательно успешным, если reviewer после него понимает:

```text
что решает каждый CASE
какое окно используется
что означает PRIMARY score
что public UI действительно показывает
когда evidence недостаточно
какие metrics подтверждены текущим protocol
что ещё требует release/human/deployment evidence
где проходит public/private boundary
```
