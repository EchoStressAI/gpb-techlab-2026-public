# Frontend Integration Guide

## 1. Цель

Frontend должен отображать не только model score, но и состояние вычисления, quality и объяснение. Главная задача интеграции — не потерять semantic distinction между успешным inference, недостаточностью evidence и технической недоступностью модели.

## 2. Основной flow

```text
choose case
→ select/upload audio
→ POST /api/v1/analyze
→ show processing state
→ render result / quality / errors
```

## 3. Case selector

Поддерживаются:

```text
CASE_1
CASE_2
```

Frontend может показывать человекочитаемые названия, но в API должен передаваться canonical `case_id`.

## 4. Аналитическое окно

UI желательно явно показывать:

```text
CASE 1 · анализ первых 60 секунд
CASE 2 · анализ первых 180 секунд
```

Не следует создавать впечатление, что модель использовала весь загруженный файл, если это не так.

## 5. Перед отправкой

Frontend может проверить:

- файл выбран;
- размер не превышает 200 MiB;
- case выбран.

Но backend остаётся authoritative для validation.

## 6. Processing state

Не использовать fake countdown «осталось 60/180 секунд», если backend не даёт реального progress.

60/180 — это **аналитический горизонт**, а не обещанная длительность вычисления.

Допустимые UI states:

```text
UPLOADING
PROCESSING
RESULT
LIMITED_EVIDENCE
ERROR
```

## 7. Result rendering

Рекомендуемый layout:

```text
[CASE / model version]
[Primary result]
[Quality badge]
[Explanation / supporting factors]
[Warnings]
[Technical details — collapsed]
```

## 8. Quality

Если runtime возвращает ограниченный evidence, UI должен сделать это заметным рядом с результатом.

Нельзя:

```text
quality=insufficient → показать зелёный «норма»
```

Лучше:

```text
Недостаточно данных для уверенной оценки
```

## 9. Runtime unavailable

HTTP 503 / `MODEL_RUNTIME_UNAVAILABLE`:

- не показывать прошлый/cached score как текущий;
- не генерировать локальный placeholder score;
- показать технический статус и возможность повторить запрос.

## 10. Contract error

HTTP 502 / `MODEL_RUNTIME_CONTRACT_ERROR` — это проблема совместимости frontend/backend/runtime stack, а не ошибка пользователя.

UI может показывать краткое сообщение:

```text
Не удалось получить корректный результат модели.
Попробуйте позже или обратитесь к администратору.
```

В developer console допустим request id, но не private traceback.

## 11. CASE 1 wording

Предпочтительно:

- «дополнительный сигнал риска»;
- «требуется дополнительная проверка»;
- «недостаточно данных».

Избегать безусловных формулировок:

- «мошенник подтверждён»;
- «клиент точно под воздействием».

## 12. CASE 2 wording

Предпочтительно:

- «речевой сигнал состояния»;
- «наблюдается изменение факторов»;
- «quality ограничивает интерпретацию».

Не использовать для автоматического решения о сотруднике и не формулировать результат как диагноз.

## 13. Model identity

Если `model_id` доступен, полезно показывать его в technical details/debug panel. Это помогает при демонстрации и воспроизводимости.

## 14. Readiness

Frontend/admin panel может проверять:

```text
GET /api/v1/readiness
```

Перед demo readiness желательно проверять заранее, а не только после неудачной загрузки.

## 15. Accessibility

Не передавать смысл только цветом.

Например:

```text
🟠 Требуется проверка
```

лучше, чем только оранжевый круг без текста.

## 16. Demo mode

Если используется prerecorded demo fallback, он должен быть явно подписан:

```text
Recorded successful run / демонстрационная запись
```

Нельзя смешивать prerecorded output с live inference.

## 17. Контракт изменений

Если backend добавляет optional поля, frontend должен оставаться устойчивым.

Изменение обязательных полей или error semantics требует синхронного обновления API docs, tests и frontend.
