# EchoStressAI — frontend

React/TypeScript интерфейс публичной части решения GPB TechLab 2026.

Frontend предназначен для демонстрации и интеграции двух сценариев:

- `CASE_1` — ранний сигнал риска внешнего психологического воздействия на клиента;
- `CASE_2` — относительный речевой сигнал состояния сотрудника/динамики.

## Архитектурная роль

Frontend не содержит model weights и не вычисляет ML score самостоятельно.

```text
browser UI
   ↓
public/API contract
   ↓
local EchoStressAI model runtime
```

Реальный backend address, токены и credentials задаются при deployment и не должны храниться в public Git.

## Конфигурация

По умолчанию frontend обращается к API на относительном пути `/api`, поэтому может работать за одним reverse proxy/origin.

Основные deployment variables:

```text
VITE_PUBLIC_ORIGIN
VITE_API_URL
API_UPSTREAM
API_HOST
```

В public source/documentation используются только placeholder values. Production/staging hostnames передаются через deployment configuration.

## Аутентификация

Токен не встраивается в bundle. В текущей демонстрационной схеме пользователь вводит его при входе, после чего валидность проверяется через `whoami`-contract.

Для production/on-prem deployment допустима более строгая схема через reverse proxy/session layer, чтобы long-lived service credentials не попадали в browser JavaScript.

## Два сценария

### CASE 1

Frontend показывает публично безопасный результат:

- PRIMARY decision/status;
- ранговый score, если evidence достаточен;
- evidence/quality status;
- model identity/version;
- safe recommendation/interpretation;
- transcript при наличии права.

Не показываются exact internal feature values, proprietary anxiety formula, research-only layers, internal thresholds/coefficients и training details.

### CASE 2

Frontend показывает:

- relative PRIMARY score/band;
- reference percentile, если он предусмотрен runtime;
- quality/evidence status;
- model identity/version;
- history/period semantics, если они доступны release-конфигурацией;
- transcript при наличии права.

Не показываются exact model coefficients, standardized feature values, imputation parameters, internal research metrics или private reference distributions.

## Важные правила отображения

- `null` означает «не измерено», а не ноль;
- score не подписывается вероятностью, если runtime явно не сообщает calibrated probability;
- `INSUFFICIENT_EVIDENCE`/аналогичный status не превращается в «низкий риск»;
- technical error не превращается в neutral model decision;
- поздний участок звонка не используется как объяснение раннего 60/180-sec score;
- XAI описывает поведение модели, а не доказанную причину состояния человека;
- CASE 2 не является автоматическим кадровым/медицинским решением.

## История CASE 2

Если connected runtime предоставляет employee-period history, UI может показывать временную последовательность primary relative score/band.

История должна строиться только при валидной идентичности сотрудника и корректной хронологии. Технический ID произвольной внешней загрузки не должен создавать ложную персональную траекторию.

Public UI не обязан раскрывать внутренние supporting metrics, использованные в research/diagnostic layers.

## Запуск для разработки

```bash
npm ci
npm run dev
```

Проверка типов/сборка:

```bash
npm run typecheck
npm run build
```

## Docker

В каталоге находятся `Dockerfile`, `Dockerfile.dev` и compose-конфигурации для frontend deployment.

Примерный локальный запуск:

```bash
docker compose up -d --build
```

Конкретные hostnames/secrets не фиксируются в Git.

## Связанные документы

- `../docs/FRONTEND_INTEGRATION.md`
- `../docs/API_REFERENCE.md`
- `../docs/RUNTIME_CONTRACT.md`
- `../docs/LIMITATIONS_AND_RESPONSIBLE_USE.md`
- `../docs/DATA_PRIVACY_SECURITY.md`
- `../docs/REQUIREMENTS_TRACEABILITY.md`

## Public/private boundary

Frontend — часть public integration layer. Он показывает смысл продукта и пользовательский workflow, но не является местом публикации proprietary model implementation EchoStressAI.
