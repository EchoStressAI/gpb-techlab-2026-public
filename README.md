# EchoStressAI · GPB TechLab 2026

[![CI](https://github.com/EchoStressAI/gpb-techlab-2026-submission/actions/workflows/ci.yml/badge.svg)](https://github.com/EchoStressAI/gpb-techlab-2026-submission/actions/workflows/ci.yml)

Публичный репозиторий конкурсного решения **EchoStressAI** для кейсов Газпромбанка в программе «Техлаб Москва 2026».

Репозиторий содержит **публичный интеграционный контур**: API, маршрутизацию двух кейсов, фиксированные временные окна, Docker, readiness/fail-closed логику, contract tests и подробную документацию. Модельные runtime-компоненты могут подключаться локально как отдельные сервисы и не требуют публикации закрытых serving artifacts или универсального proprietary core EchoStressAI.

> Ключевой принцип: если реальная модель недоступна, система **не генерирует фиктивный score** и возвращает явный технический статус.

## Два банковских сценария

| | CASE 1 | CASE 2 |
|---|---|---|
| Задача | дополнительный сигнал риска внешнего психологического воздействия на клиента | исследовательский/операционный речевой сигнал состояния сотрудника |
| Анализируемая сторона | клиент | сотрудник поддержки |
| Временное окно | первые **60 сек** | первые **180 сек** |
| Результат | score/status + quality + explanation | state signal/status + quality + explanation |
| Интерпретация | decision support для антифрод-процесса | human-in-the-loop исследовательский/операционный мониторинг |

Решение не ставит медицинских диагнозов и не предназначено для автономных значимых решений о человеке.

## Архитектура

```text
                         ┌─────────────────────────────┐
Audio upload ──────────> │ Public Integration API      │
                         │ validation · routing · XAI   │
                         └──────────────┬──────────────┘
                                        │ local HTTP contract
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
                           Unified API response
                       score · quality · explanation
```

Подробнее: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Почему public integration / private runtime

Такое разделение позволяет одновременно:

- дать проверяемый публичный код проекта;
- сохранить стабильный API независимо от версии моделей;
- развернуть inference локально/on-prem;
- не публиковать банковские данные, research notebooks и закрытые model artifacts;
- не раскрывать универсальную интегральную методологию EchoStressAI;
- обновлять CASE 1 и CASE 2 независимо;
- явно отличать «API работает» от «модели готовы».

## Что находится в репозитории

```text
src/gpb_submission/    FastAPI + runtime gateway + public contracts
tests/                 synthetic contract/smoke tests
docs/                  архитектура, Model Cards, валидация, deployment, XAI
Dockerfile              integration API image
docker-compose.yml      локальный запуск
.github/workflows/      public CI
```

Полная карта: [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Что намеренно не публикуется

Этот Git-репозиторий не содержит:

- реальные банковские аудио и транскрипты;
- персональные данные;
- training datasets и notebooks;
- приватные model weights/serving artifacts без отдельного разрешения;
- внутреннюю историю feature selection / ablation;
- универсальные proprietary формулы интегральной оценки EchoStressAI;
- personal-baseline и закрытые longitudinal/fusion rules.

Публичная граница подробно описана в [docs/PUBLIC_REPOSITORY_POLICY.md](docs/PUBLIC_REPOSITORY_POLICY.md) и [SECURITY.md](SECURITY.md).

## Быстрый запуск

Требуется Python 3.11+.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn gpb_submission.app:app --host 0.0.0.0 --port 8080
```

Проверка integration API:

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

## Подключение реальных model runtime

Integration API использует локальные HTTP runtime:

```bash
export GPB_CASE1_RUNTIME_URL=http://127.0.0.1:8101
export GPB_CASE2_RUNTIME_URL=http://127.0.0.1:8102
```

Каждый runtime должен поддерживать:

```text
GET  /health
POST /v1/analyze
```

Public gateway проверяет `case_id`, фиксированный horizon, `status` и `model_id`. Полный контракт: [docs/RUNTIME_CONTRACT.md](docs/RUNTIME_CONTRACT.md).

## API

Основные endpoint:

```text
GET  /health
GET  /readiness
GET  /api/v1/readiness
POST /api/v1/analyze
```

Пример:

```bash
curl -X POST http://127.0.0.1:8080/api/v1/analyze \
  -F case_id=CASE_1 \
  -F file=@sample.wav
```

Подробнее: [docs/API_REFERENCE.md](docs/API_REFERENCE.md).

## Health ≠ Readiness

`/health` отвечает на вопрос: **жив ли integration API?**

`/readiness` отвечает на вопрос: **доступны ли реальные runtime обоих кейсов?**

Если модель не подключена, `/readiness` возвращает `503`. Это штатное fail-closed поведение, а не попытка скрыть отсутствующий inference.

## Научная и экспертная прозрачность

В проекте отдельно документированы:

- различие между модельным сигналом и психологической интерпретацией;
- ограничения фиксированного окна 60/180 секунд;
- роль фактического speech coverage;
- экспертная рецензия и анализ расхождений;
- запрет ретроспективной подгонки порога после просмотра неудобных примеров;
- различие технических emotion classes и реальных состояний;
- quality layer и insufficient-evidence режимы.

См.:

- [docs/METHODOLOGY.md](docs/METHODOLOGY.md)
- [docs/SCIENTIFIC_BACKGROUND.md](docs/SCIENTIFIC_BACKGROUND.md)
- [docs/EXPERT_REVIEW_AND_VALIDATION.md](docs/EXPERT_REVIEW_AND_VALIDATION.md)
- [docs/VALIDATION_PROTOCOL.md](docs/VALIDATION_PROTOCOL.md)
- [docs/EXPLAINABILITY.md](docs/EXPLAINABILITY.md)

## Критерии валидации

Публичная документация фиксирует критерии заказчика и правила их корректной проверки. Критерий из ТЗ **не равен автоматически достигнутой метрике конкретной runtime-версии**.

Version-specific performance claims должны сопровождаться `model_id`, protocol, dataset role, sample size и датой расчёта.

Подробнее: [docs/VALIDATION_PROTOCOL.md](docs/VALIDATION_PROTOCOL.md).

## Документация

Полный индекс: **[docs/README.md](docs/README.md)**.

Ключевые документы:

| Документ | Назначение |
|---|---|
| [PROJECT_OVERVIEW](docs/PROJECT_OVERVIEW.md) | обзор продукта и двух кейсов |
| [METHODOLOGY](docs/METHODOLOGY.md) | публичная методология без закрытых формул |
| [CASE 1 Model Card](docs/CASE1_MODEL_CARD.md) | назначение, вход/выход, ограничения CASE 1 |
| [CASE 2 Model Card](docs/CASE2_MODEL_CARD.md) | назначение, quality и ограничения CASE 2 |
| [Expert Review](docs/EXPERT_REVIEW_AND_VALIDATION.md) | методология экспертного анализа |
| [Validation Protocol](docs/VALIDATION_PROTOCOL.md) | метрики и правила проверки |
| [API Reference](docs/API_REFERENCE.md) | endpoint и ошибки |
| [Deployment](docs/DEPLOYMENT.md) | Python/Docker/on-prem topology |
| [Demo Guide](docs/DEMO_GUIDE.md) | сценарий демонстрации |
| [Acceptance Checklist](docs/ACCEPTANCE_CHECKLIST.md) | финальная проверка |
| [Responsible Use](docs/LIMITATIONS_AND_RESPONSIBLE_USE.md) | границы интерпретации |
| [Security](docs/DATA_PRIVACY_SECURITY.md) | данные и ИБ |

## Тесты

```bash
pytest -q
```

Public CI использует только безопасные synthetic/contract fixtures и не должен требовать закрытых банковских данных или private model storage.

## Demo

Рекомендуемый сценарий:

```text
загрузка звонка
→ CASE 1 / CASE 2
→ фиксированное окно 60 / 180 сек
→ model runtime
→ score/state signal
→ quality
→ explanation
→ корректный следующий шаг
```

Важно показать также fail-closed состояние: недоступная модель не заменяется сохранённым или случайным score.

Подробнее: [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md).

## Статус

Public submission развивается по allow-list принципу. В `main` попадают только компоненты, которые нужны для интеграции/проверки проекта и прошли public-safety review.

Следующий технический этап — reference adapters и end-to-end локальное подключение реальных CASE 1 / CASE 2 runtime при сохранении этой публичной границы.

## EchoStressAI

Проект: **EchoStressAI**  
Submission: **GPB TechLab 2026**  
Архитектурный принцип: **explainable · fail-closed · on-prem-ready · human-in-the-loop**
