# Quality и достаточность evidence

## 1. Почему score недостаточно

В речевых моделях качество входа может меняться сильнее, чем кажется по длительности исходного файла. Поэтому численный score и качество evidence должны быть отдельными измерениями.

Пример:

```text
recording duration = 360 sec
analysis horizon   = 180 sec
relevant speech    = 7 sec
```

Технически модель может вернуть число, но содержательная уверенность такого результата должна быть ограничена.

## 2. Основные факторы quality

Case runtime может учитывать:

- фактический объём релевантной речи;
- число валидных сегментов;
- наличие содержательных speech segments;
- VAD/speech detection quality;
- channel/speaker attribution;
- codec/decoding issues;
- clipping/noise;
- ASR completeness, если текст используется;
- runtime fallback mode;
- конфликт между обязательными компонентами.

## 3. Quality ≠ risk

Низкое качество не означает низкий риск.

Правило:

```text
INSUFFICIENT_EVIDENCE ≠ NEGATIVE_CLASS
```

И наоборот, высокий raw score при недостаточном evidence не должен автоматически показываться как уверенное заключение.

## 4. Рекомендуемые semantic states

Конкретный runtime может иметь свою схему, но удобно различать:

```text
OK
LIMITED_EVIDENCE
INSUFFICIENT_EVIDENCE
UNUSABLE_INPUT
```

Public integration layer не навязывает эти названия, но Model Card/runtime docs должны объяснять их смысл.

## 5. CASE 1

В первые 60 секунд может быть мало клиентской речи. Это особенно важно, если клиент отвечает коротко или основную часть времени говорит оператор.

Quality layer должен позволять отличить:

- уверенно рассчитанный ранний signal;
- технически рассчитанный, но ограниченный signal;
- отсутствие достаточного клиентского материала.

## 6. CASE 2

В первые 180 секунд длинного звонка может быть мало речи сотрудника из-за:

- ожидания;
- действий клиента;
- технических пауз;
- hold;
- коротких подтверждений;
- неравномерного распределения ролей.

Экспертная рецензия показала, что короткие вокализации могут давать сильный emotional output при слабом evidence для более широкого состояния. Поэтому speech coverage должен быть видимым.

## 7. UI pattern

Рекомендуемый UI:

```text
[Result/status]
[Quality badge]
[Why / supporting factors]
[Warnings]
[Technical details]
```

Не рекомендуется скрывать quality в tooltip при сильном score.

## 8. API pattern

Пример model-runtime response:

```json
{
  "status": "ok",
  "case_id": "CASE_2",
  "model_id": "case2-runtime-v1",
  "analysis_horizon_sec": 180,
  "score": 0.62,
  "quality": {
    "status": "LIMITED_EVIDENCE",
    "speech_sec": 8.4,
    "warnings": ["low_speech_coverage"]
  }
}
```

Это лишь пример; обязательный minimum contract описан в `RUNTIME_CONTRACT.md`.

## 9. Evidence gate и reproducibility

Если runtime использует конкретный evidence gate, его version и semantics должны быть frozen вместе с model runtime. Изменение gate может изменить product behavior даже без изменения model weights.

## 10. Validation by quality

Version-specific validation полезно стратифицировать:

- all eligible samples;
- sufficient evidence;
- limited evidence;
- speech coverage bands.

Это позволяет понять, действительно ли quality flag связан с надёжностью результата.

## 11. Не использовать quality post hoc для украшения метрики

Quality criteria должны быть определены до просмотра final validation labels. Нельзя после анализа ошибок подобрать фильтр, который просто удалит неудобные случаи, и объявить улучшенную метрику основной без нового protocol.

## 12. Итог

Quality — не косметический UI field, а часть научной и инженерной честности системы. Она показывает **насколько содержательно интерпретируем конкретный model output**, не изменяя сам факт того, что inference был выполнен.
