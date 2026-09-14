# Error Model

## 1. Зачем фиксировать ошибки отдельно

В ML-сервисе важно различать:

- ошибка входа пользователя;
- недоступность model runtime;
- нарушение runtime contract;
- недостаточность evidence;
- обычный model result.

Смешение этих состояний делает UI и эксплуатацию ненадёжными.

## 2. Public API errors

### HTTP 400

Некорректный запрос:

- неизвестный `case_id`;
- пустой upload.

### HTTP 413

Файл превышает public upload limit.

### HTTP 503 — `MODEL_RUNTIME_UNAVAILABLE`

Реальный model runtime не может выполнить inference:

- URL не задан;
- connection/timeout;
- runtime service down;
- runtime returned server error.

Это **не model-negative result**.

### HTTP 502 — `MODEL_RUNTIME_CONTRACT_ERROR`

Runtime отвечает, но ответ нельзя безопасно принять:

- invalid JSON;
- case mismatch;
- horizon mismatch;
- missing `status`;
- missing `model_id`;
- иной contract violation.

## 3. Quality states не должны становиться transport errors

Если runtime успешно выполнил inference, но данных недостаточно для уверенной интерпретации, это обычно semantic model response, например:

```json
{
  "status": "ok",
  "quality": {
    "status": "INSUFFICIENT_EVIDENCE"
  }
}
```

Это отличается от HTTP 503: модель работает, но input evidence ограничен.

## 4. Frontend behavior

| Backend state | UI behavior |
|---|---|
| 200 + normal result | показать результат + quality |
| 200 + insufficient evidence | показать «недостаточно данных», не выдавать это за low risk |
| 400 | попросить исправить запрос |
| 413 | сообщить об ограничении файла |
| 502 | «ошибка совместимости model runtime» / technical state |
| 503 | «модель временно недоступна» |

## 5. Не использовать cached score как текущий inference

Если текущий запрос завершился 502/503, frontend не должен показывать прошлый score так, будто он относится к текущему файлу.

Исторический результат допустим только в явно подписанном history UI.

## 6. Safe error messages

Public error response не должен раскрывать:

- filesystem paths private runtime;
- tokens/secrets;
- полный traceback;
- internal model inventory;
- private repository URLs с credentials;
- содержимое аудио/транскрипта.

## 7. Observability mapping

Для logs/metrics удобно агрегировать:

```text
client_error_4xx
runtime_unavailable_503
runtime_contract_502
success_ok
success_limited_evidence
```

Это помогает различать operational incident и изменение качества входных данных.

## 8. Retry policy

Повтор может быть уместен для:

- transient connection error;
- runtime startup;
- temporary 5xx.

Повтор обычно не исправит:

- wrong case;
- wrong horizon;
- missing mandatory fields;
- empty file;
- insufficient speech.

Автоматический retry не должен быть бесконечным.

## 9. Model exceptions

Внутренний runtime должен переводить ожидаемые model/data errors в контролируемый response. Public gateway не должен зависеть от Python traceback конкретной модели.

## 10. Главное правило

```text
technical failure
≠ low score
≠ insufficient evidence
≠ negative prediction
```

Эти четыре состояния должны оставаться различимыми end-to-end.
