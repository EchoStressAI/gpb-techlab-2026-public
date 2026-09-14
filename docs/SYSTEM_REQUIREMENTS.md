# Системные требования

## 1. Integration API

Минимальные требования публичного слоя:

- Python 3.11+;
- Linux/macOS/Windows для локальной разработки;
- Docker 24+ для контейнерного запуска;
- доступ к локальным case runtime по HTTP.

Integration API сам по себе не требует GPU.

## 2. Model runtime

Ресурсные требования model runtime зависят от конкретной serving-версии и намеренно не зашиты в public integration contract.

Для банковского сценария рекомендуется:

- локальный Linux host;
- NVIDIA GPU для нейросетевых runtime, если конкретная версия модели его требует;
- достаточная RAM для одновременной загрузки serving artifacts;
- локальное дисковое пространство для model cache;
- закрытая внутренняя сеть между API и runtime.

## 3. Сетевые требования

Integration API должен видеть:

```text
GPB_CASE1_RUNTIME_URL
GPB_CASE2_RUNTIME_URL
```

Runtime должен поддерживать:

```text
GET /health
POST /v1/analyze
```

## 4. Порты

Примерная topology:

```text
8080 — public integration API
8101 — CASE 1 runtime (example)
8102 — CASE 2 runtime (example)
```

Runtime ports рекомендуется не публиковать во внешнюю сеть.

## 5. Хранилище

Public integration layer не требует постоянного хранения аудио.

Если конкретный runtime использует temporary files/cache, необходимо отдельно определить:

- location;
- retention;
- cleanup;
- volume encryption;
- access permissions.

## 6. GPU

Наличие GPU не является частью публичного API-контракта. Оно является свойством concrete runtime.

Readiness должен проверять функциональную доступность runtime, а не просто наличие GPU device.

## 7. Offline/on-prem

Для полностью offline режима конкретный runtime должен иметь локально доступные:

- model weights;
- tokenizer/config;
- acoustic resources;
- runtime dependencies;
- model cache.

Public integration layer не должен самовольно скачивать приватные model artifacts из GitHub/Hugging Face во время обработки аудио.

## 8. Production infrastructure

Для enterprise deployment рекомендуется:

- container registry;
- image scanning;
- reverse proxy / API gateway;
- TLS;
- authentication;
- centralized logs без чувствительного payload;
- metrics/monitoring;
- resource limits;
- restart policy;
- rollback-ready images.

## 9. Development profile

Для разработки public layer достаточно:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
pytest -q
```

Model runtime можно заменить contract-test stub только в тестовой среде. Такой stub не должен выдавать себя за реальную модель в demo/production.
