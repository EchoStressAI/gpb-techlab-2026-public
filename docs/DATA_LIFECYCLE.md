# Data Lifecycle · On-prem Processing

Этот документ описывает рекомендуемый жизненный цикл данных для банковского on-prem deployment. Public repository не содержит реальные банковские данные и не определяет внутренние retention periods Банка — они согласуются отдельно.

## 1. Логическая схема

```text
upload
→ validation
→ temporary local processing
→ model/runtime inference
→ structured result
→ permitted audit/monitoring records
→ deletion/retention according to bank policy
```

## 2. Upload

Пользователь загружает аудиозапись через UI/API.

На ingress контролируются:

- authentication/authorization;
- maximum size;
- supported media type;
- malformed input;
- case id;
- request id.

Original filename считается untrusted metadata и не должен использоваться как filesystem path.

## 3. Processing copy

Если аудио нужно декодировать/нормализовать во временный файл:

- использовать generated filename;
- ограничить permissions;
- хранить только в controlled temp location;
- не включать raw audio в application logs;
- удалить temporary copy после обработки/error cleanup.

Если конкретный runtime намеренно хранит запись дольше, это должно быть отдельной data-retention policy, а не случайным побочным эффектом pipeline.

## 4. Transcript

Transcript является чувствительным производным данным.

Правила:

- генерировать только если нужен соответствующему case/runtime;
- доступ отдельно authorizable;
- не писать полный transcript в стандартный technical log;
- не включать transcript в public telemetry;
- retention согласуется отдельно.

## 5. Acoustic / model features

Feature vectors могут содержать biometric/behavioral information и не должны считаться автоматически «безопасными» только потому, что это числа.

Для production:

- хранить минимально необходимое;
- разделять transient inference features и persistent analytics;
- ограничивать row-level access;
- не экспортировать private feature tables в public repo/issues.

## 6. Model outputs

Структурированный result может содержать:

```text
case_id
model_id
score/status
quality/evidence
safe explanation
provenance
```

Retention output определяется business process.

Для CASE 2 особенно важно отделять operational model output от медицинской/HR ground truth.

## 7. Employee history

Если включена longitudinal/history functionality:

- identity mapping контролируется Банком;
- технический upload ID не должен случайно становиться persistent employee identity;
- chronology causal/as-of;
- доступ к истории строже, чем к агрегированным dashboards;
- retention и право удаления определяются governance policy.

## 8. Logs

Стандартный technical log:

```text
request_id
case_id
model_id
status/error class
latency
safe quality flags
payload size
```

По умолчанию исключить:

```text
raw audio
full transcript
access token
personal metadata
full feature vectors
private filesystem paths
```

## 9. Audit trail

Audit log может фиксировать:

- кто запросил анализ;
- кто просмотрел sensitive result/transcript;
- время;
- action;
- object/request id;
- granted/denied status.

Audit log сам является чувствительным и должен иметь access policy/retention.

## 10. Monitoring aggregates

Для observability предпочтительны:

- counts;
- latency;
- error rates;
- readiness;
- insufficient evidence rate;
- aggregate score/quality distributions;
- resource utilization.

Row-level export не нужен для стандартного dashboard.

## 11. Public artifacts

В public Git/CI допустимы только:

- synthetic fixtures;
- schemas/contracts;
- aggregate public-safe metrics;
- anonymized methodology;
- code without secrets/data.

Не копировать production logs в GitHub issue для debugging без sanitization.

## 12. Backup / persistence

Если data persistence включена:

- определить owner;
- encrypt at rest;
- backup scope;
- restore access;
- retention;
- deletion propagation;
- separation test/prod data.

Public integration layer не должен неявно создавать долговременный архив audio.

## 13. Deletion

Должны быть известны места, где может остаться copy:

```text
upload storage
temporary files
transcript store
feature store
result DB
logs/audit
backups
monitoring exports
```

Политика удаления должна учитывать каждое применимое хранилище.

## 14. Incident path

Если обнаружена утечка:

```text
contain
→ revoke/rotate credentials if needed
→ identify affected data/copies
→ preserve incident evidence privately
→ remediate
→ notify responsible bank/data owners
→ validate clean state
```

Не публиковать sensitive incident payload в public GitHub.

## 15. Bank-specific values to define before pilot

Этот public документ намеренно не задаёт за Банк конкретные сроки.

До пилота заполнить внутри защищённого project governance:

```text
Audio retention:
Transcript retention:
Feature retention:
Result retention:
Audit retention:
Backup retention:
Authorized roles:
Deletion SLA:
Incident contact:
```

## 16. Итог

Принцип data lifecycle:

> хранить не всё, что технически возможно сохранить, а только то, что необходимо для согласованной цели, в согласованном контуре и на согласованный срок.