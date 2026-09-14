# IP и граница публичного репозитория

## 1. Зачем нужна отдельная граница

Конкурсному проекту нужен публично проверяемый код и понятная архитектура. При этом публичность GitHub-репозитория не требует публикации всех внутренних исследований, model artifacts или универсального know-how продукта EchoStressAI.

В этом submission используется принцип:

```text
public integration contract
+
separate local model runtime
```

## 2. Что публично

Публичная часть показывает, **как система интегрируется и ведёт себя**:

- API;
- case routing;
- fixed horizons;
- runtime health/readiness;
- error handling;
- Docker integration;
- synthetic tests;
- model cards;
- validation methodology;
- security/responsible-use docs.

## 3. Что остаётся вне public Git

По умолчанию закрыты:

- исходные банковские данные;
- training datasets;
- research notebooks;
- private serving weights;
- универсальная интегральная методология EchoStressAI;
- exact proprietary fusion coefficients;
- internal personal-baseline/longitudinal rules;
- закрытые research feature tables;
- internal release/build secrets.

## 4. Как public layer получает реальный результат

Integration API передаёт аудио локальному case runtime по документированному HTTP contract.

```text
integration API
      │
      ├── CASE 1 local runtime
      └── CASE 2 local runtime
```

Runtime может быть:

- отдельным Docker container;
- локальным process/service;
- compiled binary/wheel/module;
- иным on-prem component, совместимым с контрактом.

Public layer не требует знать внутреннюю формулу runtime.

## 5. Почему не remote proprietary API по умолчанию

Для банковского on-prem сценария предпочтительнее локальный runtime:

- аудио остаётся внутри защищённого контура;
- нет runtime-зависимости от внешнего сервиса EchoStressAI;
- проще воспроизводить demo/deployment;
- понятнее operational ownership;
- меньше вопросов к сетевой доступности и передаче данных.

## 6. Почему не скачивание private Git при запуске

Runtime не должен требовать доступ к private GitHub для обработки каждого звонка.

Serving artifacts должны быть подготовлены заранее и versioned как deployment component. Это отделяет build/deployment от inference.

## 7. Почему не stub в production

Test stub допустим только в automated tests и должен иметь явный test identity.

В demo/production отсутствие реального runtime приводит к `MODEL_RUNTIME_UNAVAILABLE`, а не к synthetic score.

## 8. Публичная документация и proprietary детали

Документация объясняет:

- назначение компонента;
- вход/выход;
- quality;
- validation protocol;
- ограничения;
- integration behavior.

Она намеренно не раскрывает детали, которые не нужны для понимания и интеграции конкретных банковских кейсов.

## 9. Model artifacts

Для каждого private serving artifact рекомендуется внутренне фиксировать:

```text
model_id
artifact version
SHA-256 / integrity manifest
compatible runtime version
source/ownership/license
validation reference
```

Эти сведения могут храниться во внутреннем model-artifact repository и не обязаны публиковаться полностью в public Git/API.

## 10. Публичность ≠ открытая лицензия

Сам факт public visibility GitHub не означает автоматическое разрешение на копирование/коммерческое использование вне условий применимого права и отдельной лицензии.

Актуальная repo-level пометка: [../NOTICE.md](../NOTICE.md).

## 11. Перед добавлением нового файла

Задать три вопроса:

1. Нужен ли этот файл проверяющему для понимания/интеграции проекта?
2. Содержит ли он данные, model IP или research history, которые не нужны public contract?
3. Есть ли у команды право публиковать все сторонние компоненты внутри файла?

Если хотя бы по одному пункту есть сомнение — файл не добавляется до отдельной проверки.

## 12. Итог

Public repo должен быть **настоящим и полезным**, а не искусственно пустым: API, Docker, contracts, tests и документация открыты и проверяемы. Но проверяемость интеграции не требует публикации всей исследовательской платформы EchoStressAI.
