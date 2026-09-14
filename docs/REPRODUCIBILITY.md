# Воспроизводимость

## 1. Что именно считается воспроизводимым в public repo

Публичный репозиторий обеспечивает воспроизводимость **интеграционного слоя**:

- API;
- case routing;
- фиксированных аналитических горизонтов;
- runtime contract;
- error semantics;
- Docker-запуска;
- smoke/contract tests.

Полный research training pipeline и private model artifacts не являются частью public reproducibility scope.

## 2. Минимальная проверка

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
pytest -q
```

Ожидается прохождение публичных contract/smoke tests.

## 3. Проверка сервиса

```bash
uvicorn gpb_submission.app:app --host 127.0.0.1 --port 8080
curl http://127.0.0.1:8080/health
```

Без model runtimes:

```bash
curl -i http://127.0.0.1:8080/readiness
```

должен вернуть `503`, а не искусственно считаться готовым.

## 4. Reproducible runtime contract

Для каждого case runtime требуется зафиксировать:

- `model_id`;
- case id;
- horizon;
- health semantics;
- response schema;
- versioned image/artifact reference;
- собственный internal integrity check.

Публичный gateway валидирует только безопасную часть контракта.

## 5. Synthetic fixtures

Public tests должны использовать синтетические или заведомо публичные fixtures. Реальные банковские аудио и labels не должны быть необходимы для CI.

Это позволяет GitHub Actions воспроизводить integration contract без доступа к закрытым данным.

## 6. Model reproducibility vs integration reproducibility

Важно различать:

### Integration reproducibility

Можно проверить из этого репозитория.

### Model-training reproducibility

Требует закрытых данных/артефактов и не публикуется здесь.

### Serving reproducibility

Обеспечивается versioned private runtime artifact, который должен давать стабильный model_id и пройти свои smoke/parity checks.

## 7. Неизменяемость временного окна

Тесты должны фиксировать:

- CASE 1 → 60 sec;
- CASE 2 → 180 sec.

Изменение окна является изменением model contract и требует новой версии.

## 8. Fail-closed как часть воспроизводимости

Следующие ситуации должны давать детерминированный технический результат:

- runtime URL не задан;
- runtime не отвечает;
- runtime вернул 5xx;
- runtime вернул invalid JSON;
- case mismatch;
- horizon mismatch;
- отсутствует `model_id`;
- отсутствует `status`.

## 9. Что сохранять при релизе

Для каждого релиза рекомендуется фиксировать:

```text
repository commit
container tag/digest
runtime model_id for CASE 1
runtime model_id for CASE 2
API version
smoke-test result
release date
```

Private SHA/model inventory можно хранить во внутреннем release manifest, не публикуя в public API.

## 10. Performance claims

CI этого репозитория подтверждает техническую корректность интерфейсов, но **не является доказательством ML-качества**.

ROC AUC, PR AUC, explainability acceptance и иные performance claims должны ссылаться на отдельный зафиксированный validation protocol и конкретную model version.
