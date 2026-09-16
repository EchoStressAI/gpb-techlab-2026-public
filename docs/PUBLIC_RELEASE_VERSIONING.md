# Public Release & Versioning Policy

Этот repository уже может использоваться как публичная ссылка на конкурсный проект. Поэтому важно различать **живой `main`** и **зафиксированный evaluator/release snapshot**.

## 1. Live repository vs fixed snapshot

`main` может продолжать улучшаться через reviewable pull requests.

Но любое утверждение вида «вот версия, которую мы показываем/защищаем/передаём» должно быть привязано к неизменяемой идентичности:

```text
commit SHA
или
release tag → commit SHA
```

Ссылка на repository без commit/tag показывает актуальное состояние, а не исторически фиксированную версию.

## 2. Что фиксировать перед официальным demo/review

Минимальный release identity:

```text
public_repo_commit
public_repo_tag (если есть)
integration_api_version
frontend commit/version
CASE_1 model_id
CASE_2 model_id
private/local runtime build id
container image digest
validation report id/date
CI run id
release timestamp
```

## 3. Model version и public code version — разные вещи

Public integration code может не меняться при обновлении model artifact, и наоборот.

Поэтому нельзя использовать один общий номер версии для всех слоёв без дополнительной расшифровки.

Рекомендуемая логика:

```text
public integration version
+ frontend version
+ CASE 1 model_id
+ CASE 2 model_id
+ runtime build id
```

## 4. Рекомендуемый release flow

```text
feature/docs branch
→ pull request
→ CI/public hygiene
→ review/approve
→ merge
→ final smoke on merged commit
→ freeze release identity
→ optional tag/release
→ record runtime/model/container identities
```

Для этого public repository direct commits в `main` не являются нормальным рабочим процессом.

## 5. Почему tag полезен при уже переданной ссылке

Если evaluator получил URL repository заранее, tag/commit позволяет позже однозначно указать:

> «финальная версия для демонстрации соответствует этому snapshot».

При этом сам repository может продолжать содержать последующие исправления.

## 6. Что не делать после фиксации snapshot

Без отдельного решения команды не следует:

- force-push protected/release history;
- переписывать опубликованный release commit;
- незаметно менять model artifact под прежним `model_id`;
- заявлять новую метрику от имени старого release;
- подменять failed/insufficient result новым synthetic score.

Если обнаружена проблема, правильнее выпустить новый commit/tag с описанием изменения.

## 7. Security exception

Если в public Git когда-либо попал настоящий secret/credential:

1. считать secret раскрытым;
2. немедленно rotate/revoke его;
3. определить operational impact;
4. только затем отдельно решать, требуется ли history cleanup.

Удаление строки последующим commit не делает ранее опубликованный secret безопасным.

Infrastructure hostname/endpoint также следует считать публично известным, если он уже попал в commit/PR metadata.

## 8. Performance claims

Любая release-level метрика должна быть связана с конкретным:

```text
case_id
model_id
runtime/preprocessing version
validation protocol
sample size
analysis horizon
quality rules
calculation date
```

Зелёный CI public repo не является подтверждением ML-quality.

## 9. Suggested snapshot naming

Конкретное имя тега команда выбирает отдельно. Формат может быть, например:

```text
techlab-2026-demo-v1
techlab-2026-final-v1
```

Имя тега не должно использоваться до фактического freeze/approval.

## 10. Reviewer-facing rule

Если документация или презентация содержит ссылку на GitHub, рядом с критичными claims желательно указывать commit/tag финального snapshot.

Так reviewer может восстановить ровно тот code state, к которому относятся демонстрация, validation evidence и runtime identity.

Связанные документы:

- `SUBMISSION_MANIFEST.md` — состав публичной/локальной части;
- `VALIDATION_PROTOCOL.md` — правила model evidence;
- `ACCEPTANCE_CHECKLIST.md` — pre-demo проверки;
- `DEPENDENCIES_AND_LICENSES.md` — dependency/release governance.