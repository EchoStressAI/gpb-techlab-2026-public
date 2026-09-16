# Monitoring & Drift Plan

Этот документ описывает, что контролировать после подключения model runtime в pilot/production-like контуре. Мониторинг не должен требовать публикации банковских данных в public repository.

## 1. Три класса мониторинга

```text
technical health
+ input/data drift
+ model/product behavior
```

Один зелёный `/health` не означает, что модель продолжает работать содержательно так же.

## 2. Technical health

Минимальные operational показатели:

- runtime readiness;
- request/error rate;
- latency median/p90/max;
- timeout rate;
- GPU/CPU/RAM utilization;
- queue length;
- container restarts;
- contract errors;
- model/version identity.

Alert нужен, если runtime технически жив, но PRIMARY model artifacts недоступны.

## 3. Input quality

Контролировать агрегированно:

- file duration;
- speech coverage;
- channel count/routing success;
- VAD/segmentation outcomes;
- ASR observability, если text branch используется;
- insufficient-evidence rate;
- audio-quality warnings.

Рост `INSUFFICIENT_EVIDENCE` может быть data/process incident, даже если score distribution визуально стабилен.

## 4. Distribution drift

Без раскрытия raw features наружу можно отслеживать внутри банковского контура:

- drift по безопасным acoustic families;
- score distribution;
- risk-band distribution;
- speech coverage;
- duration/channel profiles;
- ASR text-availability rate;
- employee/call volume by permitted operational segment.

Reference period и statistic должны быть versioned.

## 5. CASE 1 monitoring

Особенно отслеживать:

- долю insufficient evidence;
- долю safe-negative / review / elevated outcomes;
- false escalation по мере появления labels;
- additional detection;
- changes in operator workflow that can create shortcut drift;
- change in client talk-time structure;
- performance by channel/process version.

Если банковский process существенно изменился, прошлый validation не считается автоматически переносимым.

## 6. CASE 2 monitoring

Отслеживать:

- employee-period score distribution;
- calls per employee-period;
- speech coverage;
- recording-condition changes;
- reference-band stability;
- within-person directional behavior;
- missing-history / identity continuity;
- disagreement with BAT/expert/HR reference when new validation labels become available.

Не превращать monitoring score в автоматический HR action.

## 7. Outcome drift

Когда ground truth появляется с задержкой, считать отдельно:

```text
model drift now
outcome/performance drift later
```

Для delayed labels сохранять release/model identity, чтобы новая ground truth сопоставлялась именно с той версией, которая сделала prediction.

## 8. Threshold / band governance

Порог или risk bands нельзя незаметно менять для восстановления красивого distribution.

Изменение требует:

1. новой version identity;
2. причины;
3. validation на допустимом наборе;
4. update документации/UI semantics;
5. comparison with previous version.

## 9. Drift response levels

### Level 0 · normal

Нет существенных технических/data/model deviations.

### Level 1 · investigate

Например:

- умеренный рост latency;
- небольшой shift score/input distributions;
- рост insufficiency.

Действие: анализ без автоматической смены model version.

### Level 2 · restrict

Например:

- сильный domain shift;
- evidence rate вышел за operational bound;
- новый recording/channel process;
- unexplained change outcome metrics.

Действие: усилить human review / ограничить scope.

### Level 3 · fail closed / rollback

Например:

- contract/model corruption;
- severe quality regression;
- critical security incident;
- wrong model artifact/version.

Действие: rollback/disable affected inference path.

## 10. Privacy-preserving monitoring

Для стандартных dashboards предпочтительны агрегаты и technical identifiers.

Не требуется по умолчанию хранить в monitoring system:

- raw audio;
- полный transcript;
- персональные feature vectors;
- medical/HR narrative notes.

Доступ к row-level investigation data определяется внутренней политикой Банка.

## 11. Recommended release dashboard

Минимальные panels:

```text
Requests / success / errors
Latency p50/p90/max
Readiness by CASE/model_id
Insufficient evidence rate
Speech coverage
Outcome distribution
Model/version mix
Resource utilization
Drift alerts
```

При появлении labels:

```text
PR/ROC/precision/recall by frozen model version
```

## 12. Revalidation triggers

Обязательная повторная validation при:

- смене model artifact;
- смене preprocessing;
- крупном изменении телефонии/каналов;
- существенном изменении process/workflow;
- новом population/domain;
- новом языке;
- изменении target definition;
- изменении threshold/bands;
- устойчивом drift alert.

## 13. Reporting

Monitoring report должен всегда содержать:

```text
period
model IDs
runtime version
sample counts
known data/process changes
alerts
actions taken
```

## 14. Итог

Production monitoring должен отвечать не только на вопрос **«сервис жив?»**, но и:

> «мы всё ещё видим тот же тип данных, тем же способом, той же model version, и интерпретация score остаётся валидной для заявленного scope?»