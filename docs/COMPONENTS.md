# Компоненты и зависимости

## 1. Публичный integration layer

| Компонент | Назначение |
|---|---|
| FastAPI | HTTP API и OpenAPI |
| Uvicorn | ASGI server |
| httpx | взаимодействие с локальными model runtime |
| python-multipart | загрузка аудиофайлов multipart/form-data |
| pytest | contract/smoke tests |
| Docker | контейнеризация integration API |
| GitHub Actions | публичный CI |

Точные допустимые диапазоны версий зафиксированы в `pyproject.toml`.

## 2. Python

Проект требует:

```text
Python >= 3.11
```

Публичная часть не привязана к конкретной CUDA/PyTorch версии, потому что ML inference расположен в отдельных case runtime.

## 3. CASE runtime

Публичный contract не требует конкретного framework внутри runtime. Реализация может использовать PyTorch или другой подход, если соблюдает HTTP contract.

Каждая поставляемая runtime-версия должна отдельно фиксировать:

```text
model_id
Python/runtime version
ML framework version
CUDA/runtime requirements (если есть)
model artifact version
preprocessing version
```

## 4. Почему версии ML runtime не зашиты сюда

Model runtime развивается независимо от integration layer. Жёсткая фиксация private runtime dependency в public repo создала бы ложную связь между API release и model release.

Вместо этого compatibility определяется contract tests.

## 5. Контрактные компоненты

Публичная архитектура состоит из следующих логических блоков:

```text
Upload API
  ↓
Case router
  ↓
Runtime gateway
  ↓
CASE 1 runtime / CASE 2 runtime
  ↓
Contract validation
  ↓
Unified response
```

## 6. Что не является публичным компонентом

Не входят в этот repository dependency inventory:

- закрытые model weights;
- training frameworks/notebooks;
- private research packages;
- proprietary integral engine;
- банковские datasets;
- licensed third-party model artifacts, если право публикации отдельно не подтверждено.

## 7. SBOM / production

Для реальной on-prem поставки рекомендуется формировать SBOM уже на уровне финального Docker image, потому что именно image определяет фактический набор библиотек.

Минимально хранить:

- package name/version;
- license;
- source;
- image digest;
- vulnerability scan date.

## 8. Проверка версии public layer

```bash
python -c "import gpb_submission; print(gpb_submission.__version__)"
```

Если package version изменяется, README/API docs должны быть пересмотрены вместе с релизом.
