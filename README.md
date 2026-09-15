# EchoStressAI · GPB TechLab 2026

[![CI](https://github.com/EchoStressAI/gpb-techlab-2026-public/actions/workflows/ci.yml/badge.svg)](https://github.com/EchoStressAI/gpb-techlab-2026-public/actions/workflows/ci.yml)

Публичный репозиторий конкурсного решения **EchoStressAI** для кейсов Газпромбанка в программе «Техлаб Москва 2026».

Репозиторий содержит публично проверяемую часть решения: integration API, frontend, маршрутизацию двух кейсов, фиксированные временные окна, Docker, readiness/fail-closed логику, contract/smoke tests и подробную документацию. Model runtime подключается локально/on-prem через стабильный контракт; закрытые serving artifacts и универсальный proprietary core EchoStressAI в public Git не публикуются.

> Ключевой принцип: если реальная модель недоступна, система **не генерирует фиктивный score** и возвращает явный технический статус.

## Два банковских сценария

| | CASE 1 | CASE 2 |
|---|---|---|
| Задача | дополнительный сигнал риска внешнего психологического воздействия на клиента | речевой сигнал состояния сотрудника / риска неблагоприятной динамики |
| Анализируемая сторона | клиент | сотрудник поддержки |
| Временное окно | первые **60 сек** | первые **180 сек** |
| Результат | score/status + evidence/quality + explanation | relative score/band + quality + explanation/history semantics |
| Использование | decision support для антифрод-процесса | human-in-the-loop операционный/исследовательский мониторинг |

Решение не ставит медицинских диагнозов и не предназначено для автономных значимых решений о человеке.

## Архитектура

```text
                         ┌─────────────────────────────┐
Audio upload / UI ─────> │ Public Integration Layer    │
                         │ validation · routing · API   │
                         └──────────────┬──────────────┘
                                        │ local runtime contract
                         ┌──────────────┴──────────────┐
                         │                             │
                         v                             v
                ┌─────────────────┐          ┌─────────────────┐
                │ CASE 1 runtime  │          │ CASE 2 runtime  │
                │ horizon: 60 sec │          │ horizon: 180 sec│
                └─────────────────┘          └─────────────────┘
                         │                             │
                         └──────────────┬──────────────┘
                                        v
                           score · quality · XAI
                                  │
                                  v
                              Frontend
```

Подробнее: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Что находится в репозитории

```text
src/gpb_submission/    FastAPI + runtime gateway + public contracts
frontend/              React/TypeScript UI
tests/                 synthetic contract/smoke tests
docs/                  architecture, Model Cards, validation, deployment, XAI
Dockerfile              integration API image
docker-compose.yml      local integration launch
.github/workflows/      public CI
```

Полная карта: [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Public integration / local model runtime

Публичный Git показывает, **как решение интегрируется и ведёт себя**, но не обязан публиковать веса и исходники model runtime.

Такое разделение позволяет:

- дать проверяемый код API/UI/integration;
- сохранить стабильный контракт независимо от версии моделей;
- разворачивать inference локально/on-prem;
- не публиковать банковские данные, research notebooks и model weights;
- не раскрывать универсальную интегральную методологию EchoStressAI;
- независимо обновлять CASE 1 и CASE 2;
- различать «сервис жив» и «модель готова».

Граница IP: [docs/IP_AND_PUBLIC_BOUNDARY.md](docs/IP_AND_PUBLIC_BOUNDARY.md).

## Быстрый запуск integration API

Требуется Python 3.11+.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn gpb_submission.app:app --host 0.0.0.0 --port 8080
```

Проверка:

```bash
curl http://127.0.0.1:8080/health
curl -i http://127.0.0.1:8080/api/v1/readiness
```

Swagger/OpenAPI:

```text
http://127.0.0.1:8080/docs
http://127.0.0.1:8080/openapi.json
```

Docker:

```bash
docker compose up --build
```

## Подключение реального model runtime

Integration API ожидает локальные runtime endpoints:

```bash
export GPB_CASE1_RUNTIME_URL=http://127.0.0.1:8101
export GPB_CASE2_RUNTIME_URL=http://127.0.0.1:8102
```

Каждый case runtime поддерживает public contract:

```text
GET  /health
POST /v1/analyze
```

Bridge к более богатому локальному backend описан в [docs/GPB_AUDIO_RISK_ADAPTER.md](docs/GPB_AUDIO_RISK_ADAPTER.md).

## Frontend

`frontend/` — React/TypeScript UI для демонстрационного и integration-сценария. Реальный backend address, токены и credentials не хранятся в Git и передаются через deployment configuration.

Frontend должен показывать public-safe projection результата: PRIMARY score/status, quality/evidence, safe semantic explanation и временной provenance — без раскрытия точных model coefficients, internal feature values или research-only payloads.

Подробнее: [frontend/README.md](frontend/README.md) и [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md).

## Health ≠ Readiness

`/health` отвечает на вопрос: **жив ли integration API?**

`/readiness` отвечает на вопрос: **доступны ли реальные runtime обоих кейсов?**

Если модель не подключена, `/readiness` возвращает `503`. Это штатное fail-closed поведение.

## ML semantics

Публичная документация не ограничивается фразой «внутри ML». Она описывает безопасную смысловую структуру:

- какую сторону разговора анализирует каждый кейс;
- какое временное окно используется;
- какие семейства речевой/акустической информации имеют смысл;
- чем score отличается от evidence/quality;
- какие объяснения можно показывать пользователю;
- где проходит граница proprietary implementation.

См. [docs/METHODOLOGY.md](docs/METHODOLOGY.md), Model Cards и документацию по explainability.

## Валидация и научная прозрачность

Документация разделяет:

- model signal и психологическую интерпретацию;
- раннее окно и полный звонок;
- score и достаточность данных;
- expert review и ground truth;
- product runtime и research-only версии.

Критерий из ТЗ **не равен автоматически достигнутой метрике любой runtime-версии**. Performance claim должен сопровождаться `model_id`, protocol, dataset role/sample size и датой расчёта.

См.:

- [docs/SCIENTIFIC_BACKGROUND.md](docs/SCIENTIFIC_BACKGROUND.md)
- [docs/EXPERT_REVIEW_AND_VALIDATION.md](docs/EXPERT_REVIEW_AND_VALIDATION.md)
- [docs/CASE2_EXPERT_REVIEW_LESSONS.md](docs/CASE2_EXPERT_REVIEW_LESSONS.md)
- [docs/VALIDATION_PROTOCOL.md](docs/VALIDATION_PROTOCOL.md)

## Документация

Полный индекс: **[docs/README.md](docs/README.md)**.

Ключевые документы:

| Документ | Назначение |
|---|---|
| [PROJECT_OVERVIEW](docs/PROJECT_OVERVIEW.md) | обзор продукта и двух кейсов |
| [METHODOLOGY](docs/METHODOLOGY.md) | публичная методология без закрытых формул |
| [CASE 1 Model Card](docs/CASE1_MODEL_CARD.md) | назначение, вход/выход, ограничения CASE 1 |
| [CASE 2 Model Card](docs/CASE2_MODEL_CARD.md) | назначение, quality и ограничения CASE 2 |
| [Requirements Traceability](docs/REQUIREMENTS_TRACEABILITY.md) | где реализовано/подтверждается требование |
| [Expert Review](docs/EXPERT_REVIEW_AND_VALIDATION.md) | методология экспертного анализа |
| [Validation Protocol](docs/VALIDATION_PROTOCOL.md) | метрики и правила проверки |
| [API Reference](docs/API_REFERENCE.md) | endpoint и ошибки |
| [Deployment](docs/DEPLOYMENT.md) | Python/Docker/on-prem topology |
| [Demo Guide](docs/DEMO_GUIDE.md) | сценарий демонстрации |
| [Responsible Use](docs/LIMITATIONS_AND_RESPONSIBLE_USE.md) | границы интерпретации |
| [Security](docs/DATA_PRIVACY_SECURITY.md) | данные и ИБ |

## Тесты и public hygiene

```bash
python scripts/check_public_hygiene.py .
pytest -q
```

Frontend отдельно проходит typecheck/build в CI. Public CI использует только безопасные synthetic/contract fixtures и не должен требовать закрытых банковских данных или private model storage.

## Что намеренно не публикуется

Public Git не содержит:

- реальные банковские аудио и транскрипты;
- персональные данные;
- training datasets/notebooks;
- приватные model weights/serving artifacts;
- exact proprietary feature engineering/coefficients;
- внутреннюю формулу тревожности;
- универсальные integral/fusion/personal-baseline rules EchoStressAI;
- production credentials/real deployment endpoints.

## EchoStressAI

Проект: **EchoStressAI**  
Submission: **GPB TechLab 2026**  
Архитектурный принцип: **explainable · fail-closed · on-prem-ready · human-in-the-loop**
