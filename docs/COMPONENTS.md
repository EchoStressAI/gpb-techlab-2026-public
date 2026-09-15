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

Диапазоны версий зафиксированы в `pyproject.toml`.

## 2. Public frontend

| Компонент | Назначение |
|---|---|
| React | UI |
| React DOM | browser rendering |
| React Router | client-side routing |
| TypeScript | типизация public API/frontend contract |
| Vite | frontend build/dev server |

Диапазоны прямых зависимостей задаются в `frontend/package.json`, resolved graph — в `frontend/package-lock.json`.

## 3. Python

Проект требует:

```text
Python >= 3.11
```

Публичная часть не привязана к конкретной CUDA/PyTorch версии, потому что ML inference расположен в отдельных case runtime.

`pyproject.toml` сейчас задаёт version ranges, поэтому exact resolved Python environment должен фиксироваться отдельно для конкретного release/image.

## 4. CASE runtime

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

## 5. Почему версии ML runtime не зашиты сюда

Model runtime развивается независимо от integration layer. Жёсткая фиксация private runtime dependency в public repo создала бы ложную связь между API release и model release.

Вместо этого compatibility определяется contract tests + release/runtime manifest.

## 6. Контрактные компоненты

Публичная архитектура состоит из следующих логических блоков:

```text
Frontend / Upload API
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

## 7. Что не является публичным компонентом

Не входят в этот repository dependency inventory:

- закрытые model weights;
- training frameworks/notebooks;
- private research packages;
- proprietary integral engine;
- банковские datasets;
- licensed third-party model artifacts, если право публикации отдельно не подтверждено.

## 8. SBOM / production

Для реальной on-prem поставки рекомендуется формировать SBOM уже на уровне финального Docker image, потому что именно image определяет фактический набор библиотек.

Минимально хранить:

- package name/version;
- license;
- source;
- image digest;
- vulnerability scan date.

Подробно: [DEPENDENCIES_AND_LICENSES.md](DEPENDENCIES_AND_LICENSES.md).

## 9. Release/version identity

Версия public integration layer не должна автоматически считаться версией model runtime.

Для evaluator/deployment snapshot фиксируются как минимум commit/tag публичного repo, model ids, runtime build и container digest.

Подробно: [PUBLIC_RELEASE_VERSIONING.md](PUBLIC_RELEASE_VERSIONING.md).

## 10. Проверка версии public layer

```bash
python -c "import gpb_submission; print(gpb_submission.__version__)"
```

Если package version изменяется, README/API docs должны быть пересмотрены вместе с релизом.
