# Testing Strategy

## 1. Что проверяет public test suite

Public tests предназначены для проверки **integration contract**, а не ML-качества закрытых моделей.

Текущая базовая suite фиксирует:

- `/health` отвечает 200;
- CASE 1 horizon = 60 sec;
- CASE 2 horizon = 180 sec;
- `/readiness` fail-closed без runtime;
- неизвестный case отклоняется;
- `/api/v1/analyze` не генерирует fake score при отсутствии runtime;
- нормализация case id;
- frozen case horizons.

## 2. Запуск

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
pytest -q
```

## 3. CI

GitHub Actions запускает public tests на Pull Request и/или изменениях `main` согласно workflow.

CI должен работать без:

- private credentials;
- банковских аудио;
- private model artifacts;
- доступа к research Google Drive;
- external paid API.

## 4. Что следует расширять

Следующие contract tests рекомендуется добавлять вместе с runtime adapters:

### Runtime health

- valid CASE 1 health;
- valid CASE 2 health;
- case mismatch;
- non-JSON health;
- timeout.

### Analyze

- happy-path CASE 1;
- happy-path CASE 2;
- runtime 5xx;
- runtime 4xx;
- non-JSON response;
- missing `status`;
- missing `model_id`;
- wrong horizon;
- wrong case id;
- upload >200 MiB;
- empty upload.

### Security/robustness

- filename/path traversal does not become local path;
- unexpected MIME type is handled explicitly by runtime;
- secrets are not included in error output;
- raw audio is not logged by public layer.

## 5. Synthetic runtime fixtures

Для end-to-end tests допустим synthetic mock runtime, если он явно называется fixture/stub и используется только в tests.

Такой stub:

- не должен попадать в production/demo как будто это реальная модель;
- не должен выдавать себя за validated model;
- должен иметь очевидный test-only model_id.

## 6. ML validation отдельно

ML performance tests должны жить в version-specific validation evidence и не смешиваться с unit/contract tests public repo.

Пример разделения:

```text
pytest / CI
    → API contract works

runtime parity test
    → serving reproduces frozen model output

validation report
    → ROC AUC / PR AUC / explainability evidence
```

## 7. Regression policy

Любое изменение:

- case IDs;
- horizons;
- required runtime fields;
- public endpoint;
- HTTP error semantics;

требует regression test.

## 8. Release smoke

Перед демонстрацией, помимо CI, выполнить real-runtime smoke:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/api/v1/readiness
```

и по одному безопасному аудиофайлу на каждый кейс.

## 9. Test evidence

Для демонстрационного релиза полезно сохранять:

```text
commit SHA
CI run URL/id
pytest result
runtime model IDs
E2E smoke timestamp
```

Это позволяет отличить «код в Git есть» от конкретно проверенной демонстрационной сборки.
