# Submission Manifest · EchoStressAI GPB TechLab 2026

Этот документ фиксирует состав публичного репозитория и границу между тем, что доступно в Git, и тем, что подключается как отдельный локальный runtime/deployment component.

## 1. Public repository

В публичном Git находятся:

```text
src/gpb_submission/     integration API / runtime gateway
frontend/               пользовательский интерфейс
tests/                  synthetic contract/smoke tests
docs/                   архитектура, methodology, model cards, validation, deployment
Dockerfile               integration image
docker-compose*.yml      локальная topology
.github/workflows/       CI / public hygiene
```

Публичная часть позволяет проверить:

- структуру решения;
- API contracts;
- CASE 1 / CASE 2 routing;
- fixed horizons 60/180 sec;
- fail-closed behavior;
- frontend behavior;
- quality/evidence semantics;
- documentation completeness;
- build/test reproducibility публичного integration layer.

## 2. Connected local runtime

Case-specific inference может поставляться/запускаться отдельно от public Git.

Локальный runtime отвечает за:

- аудио preprocessing;
- model inference;
- case-specific serving artifacts;
- runtime-level quality checks;
- version-specific model output;
- model-specific XAI/provenance.

Public layer взаимодействует с runtime по документированному contract и не требует раскрывать его training code или model weights.

## 3. Что не является частью public source distribution

По умолчанию не публикуются:

- реальные банковские аудиозаписи;
- реальные транскрипты/персональные данные;
- training datasets;
- research notebooks;
- private model weights/checkpoints;
- exact scorer coefficients/intercepts;
- scaler/imputer parameters;
- private reference distributions;
- внутренняя формула тревожности;
- универсальная интегральная/fusion/personal-baseline методология EchoStressAI;
- внутренние research/debug artifacts;
- secrets/tokens/production credentials.

## 4. Release identity

Для конкретной демонстрации или deployment snapshot рекомендуется фиксировать:

```text
public_repo_commit
integration_api_version
frontend_version/commit
CASE_1 model_id
CASE_2 model_id
runtime build/version
container tag/digest
validation report id/date
CI run
release timestamp
```

Это позволяет отделить свойства конкретной model/runtime версии от общих свойств репозитория.

## 5. Evidence map

| Что проверяется | Где смотреть |
|---|---|
| Назначение проекта | `PROJECT_OVERVIEW.md` |
| Архитектура | `ARCHITECTURE.md`, `DIAGRAMS.md` |
| Смысл ML | `MODEL_SEMANTICS.md`, Model Cards |
| API | `API_REFERENCE.md`, `RUNTIME_CONTRACT.md` |
| Frontend | `frontend/`, `FRONTEND_INTEGRATION.md` |
| Научная основа | `SCIENTIFIC_BACKGROUND.md`, `SCIENTIFIC_REFERENCES.md` |
| Expert review | `EXPERT_REVIEW_AND_VALIDATION.md`, `CASE2_EXPERT_REVIEW_LESSONS.md` |
| Validation rules | `VALIDATION_PROTOCOL.md`, `VALIDATION_EVIDENCE_INDEX.md` |
| ТЗ / traceability | `REQUIREMENTS_TRACEABILITY.md` |
| Security/privacy | `DATA_PRIVACY_SECURITY.md`, `SECURITY.md` |
| IP boundary | `IP_AND_PUBLIC_BOUNDARY.md`, `NOTICE.md` |
| Deployment | `DEPLOYMENT.md`, `SYSTEM_REQUIREMENTS.md` |
| Финальная готовность | `ACCEPTANCE_CHECKLIST.md` |

## 6. Что означает «репозиторий воспроизводим»

Есть два уровня воспроизводимости.

### Public integration reproducibility

Можно воспроизвести:

- сборку public API/frontend;
- contracts;
- synthetic tests;
- fail-closed behavior;
- Docker integration.

### Full inference reproducibility

Для реального inference additionally нужны versioned case runtimes и serving artifacts. Они могут быть переданы или развёрнуты отдельно в on-prem контуре и не обязаны быть публичными.

## 7. Почему это не stub-only repository

Public repo содержит реальный integration/UI code, а не сохранённые результаты для заранее известных файлов. При подключённом локальном runtime он выполняет end-to-end обработку через стабильный contract.

Если runtime отсутствует, система должна честно показывать unavailable/not-ready, а не генерировать synthetic model score.

## 8. Перед публикацией ссылки

Перед передачей ссылки проверяются:

- public hygiene CI;
- отсутствие банковских данных/weights/secrets;
- актуальность README/docs;
- корректность repository badge/links;
- согласованность frontend и backend contracts;
- отсутствие лишних internal implementation details;
- наличие version-specific validation evidence для заявляемых метрик.

Подробный checklist: [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md).