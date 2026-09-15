# Evaluator Demo Script · 10–12 минут

Этот сценарий предназначен для демонстрации проекта жюри/заказчику. Он построен так, чтобы показать **не только успешный score, но и корректное поведение системы на границах**, соответствующее ТЗ и заявленной методологии.

## 0. До начала

Зафиксировать:

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
CASE 1 · клиент · <=60 сек · риск внешнего воздействия
CASE 2 · сотрудник · <=180 сек · относительный риск/состояние
```

Ключевая формулировка:

> Система даёт дополнительный объяснимый сигнал и quality/evidence, а не автономный диагноз или юридический вывод.

## 2. 60 секунд · архитектура

Показать схему:

```text
Frontend
→ API / case routing
→ fixed 60/180-sec horizon
→ local case runtime
→ PRIMARY + quality/evidence + safe explanation
```

Подчеркнуть:

- on-prem-ready;
- no mandatory external cloud inference;
- no fake score when runtime unavailable;
- public repo не содержит банковские данные/weights.

## 3. 2 минуты · CASE 1 обычный пример

Загрузить безопасный demo-файл CASE 1.

Показать:

1. выбран CASE 1;
2. фиксированное окно 60 сек;
3. PRIMARY result/decision status;
4. evidence sufficiency;
5. model id/provenance;
6. следующий допустимый шаг.

Формулировка:

> Score — ранговый модельный сигнал. Это не вероятность воздействия, если calibration отдельно не доказана.

Не говорить:

- «вероятность мошенничества X%»;
- «модель доказала воздействие»;
- «операторская речь подтверждает состояние клиента».

## 4. 1 минута · CASE 1 insufficient evidence

Загрузить/открыть заранее подготовленный пример, где клиент почти не говорил.

Показать:

```text
INSUFFICIENT_EVIDENCE / limited evidence
```

Объяснить:

> Отсутствие достаточного сигнала не превращается автоматически в «клиент безопасен».

Это одна из ключевых защит системы.

## 5. 2 минуты · CASE 2

Загрузить безопасный demo-файл CASE 2.

Показать:

1. окно 180 сек;
2. relative score/risk band;
3. model id;
4. quality/speech coverage;
5. безопасные factor families / XAI summary;
6. responsible-use disclaimer.

Ключевая формулировка:

> Это относительный speech-based signal состояния/риска, а не медицинская диагностика и не автоматическое HR-решение.

## 6. 1 минута · история / period semantics

Если final runtime/frontend включает history:

- показать несколько наблюдений одного employee id;
- подчеркнуть chronological/as-of semantics;
- не делать вывод по одной строке;
- не использовать будущие звонки для объяснения прошлого результата.

Если history в snapshot не включена — этот блок пропустить, не имитировать её synthetic data.

## 7. 1 минута · почему CASE 2 acoustic-first

Коротко объяснить engineering choice:

> Мы исследовали acoustic и textual branches. PRIMARY оставили проще, если text/fusion не давал устойчивого выигрыша, потому что это снижает deployment complexity и повышает объяснимость.

Не выдавать наличие дополнительной модальности за доказанный прирост качества.

## 8. 1 минута · валидация

Показать aggregate metrics только с правильной семантикой.

CASE 1:

- основной критерий — PR AUC;
- дополнительно ROC AUC / weighted F1 / safe-negative behavior;
- отдельно показать shortcut audit.

CASE 2:

- ROC AUC проверяется version-specific protocol;
- explainability ≥80% — отдельный human-acceptance protocol, а не просто наличие XAI.

Фраза:

> CI доказывает работоспособность software contract. ML quality доказывает validation report. Это разные evidence layers.

## 9. 30 секунд · fail-closed

Если позволяет время, показать один технический boundary:

- runtime unavailable;
- readiness = not ready;
- API не генерирует fake score.

Это усиливает доверие больше, чем ещё один «идеальный» кейс.

## 10. 30 секунд · финал

Финальная формулировка:

> EchoStressAI объединяет два банковских сценария в один on-prem-ready контур: фиксированное раннее окно, объяснимый PRIMARY, quality/evidence и human-in-the-loop. Мы отдельно проверяем не только метрику, но и происхождение сигнала, чтобы не выдавать procedural shortcut или эмоциональный proxy за целевой риск.

## 11. Что должно быть подготовлено заранее

- 1 безопасный CASE 1 demo;
- 1 CASE 1 insufficient-evidence demo;
- 1 безопасный CASE 2 demo;
- при необходимости history example;
- release/model IDs;
- validation summary;
- prerecorded screen capture как аварийный fallback с явной маркировкой;
- локальный Docker/runtime snapshot.

## 12. Что не должно находиться в public demo bundle

- реальные банковские аудио без отдельного разрешения;
- реальные персональные transcripts;
- internal feature tables;
- exact model coefficients;
- model weights, если их публикация не разрешена;
- passwords/tokens;
- row-level validation predictions.

## 13. Вопросы, к которым быть готовыми

- Почему PR AUC CASE 1 ниже ROC AUC?
- Почему вы отказались от operator-only сильного сигнала?
- Почему CASE 2 не использует text в PRIMARY?
- Как измеряется explainability ≥80%?
- Где доказательство 1×A100 / latency?
- Почему weights нет в public Git?
- Как обеспечивается on-prem?
- Как вы избегаете диагноза по одному звонку?
- Чем quality/evidence отличается от score?

Ответы должны совпадать с Model Cards, Validation Protocol и FAQ.

## 14. Demo pass rule

Демонстрация считается успешной, если reviewer после неё может ответить:

```text
что решает каждый CASE
какое окно используется
что означает score
когда системе нельзя доверять результату
какой следующий шаг
какие claims подтверждены validation
что остаётся proprietary/runtime-specific
```

Если это понятно — demo показывает продукт, а не только набор моделей.