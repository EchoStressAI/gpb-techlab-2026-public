# Данные, приватность и безопасность

## 1. Общий принцип

Репозиторий публичный. Следовательно, любой committed файл, ветка, Pull Request, issue и Git history потенциально доступны третьим лицам.

Поэтому правило проекта:

> **никакие персональные, банковские, исследовательские или закрытые model artifacts не должны попадать в public Git даже временно.**

Удаление файла позднее не считается достаточной защитой, потому что данные могут сохраниться в Git history, fork, cache или clone.

## 2. Запрещённые данные

В public repo нельзя коммитить:

- реальные банковские аудиозаписи;
- реальные транскрипты звонков;
- ФИО, номера телефонов, документы и иные персональные данные;
- внутренние идентификаторы сотрудников, если они позволяют идентификацию;
- CONTROL/TRAIN labels из закрытых наборов;
- приватные expert review cards с реальными файлами;
- access tokens, API keys, пароли, cookies, SSH/private keys;
- внутренние model weights без отдельного разрешения;
- закрытые research archives;
- `.env` с секретами;
- внутренние Google Drive paths и служебные выгрузки.

## 3. Что допустимо

Допустимы:

- синтетические примеры;
- обезличенные схемы;
- публичные API contracts;
- high-level model cards;
- код интеграционного слоя;
- Docker/CI;
- тестовые fixtures, не происходящие из реальных персональных данных;
- агрегированные научные выводы без возможности обратной идентификации.

## 4. Обработка аудио

В on-prem архитектуре аудио может передаваться только между локальными сервисами заказчика:

```text
UI/API → local integration layer → local model runtime
```

Публичный integration layer сам по себе не требует отправки аудио в EchoStressAI или стороннее облако.

## 5. Логирование

Рекомендуется логировать только технически необходимые сведения:

- request id;
- case id;
- model id;
- latency;
- status/error class;
- размер файла;
- безопасные quality flags.

Не рекомендуется по умолчанию логировать:

- полный multipart payload;
- аудио;
- транскрипт;
- персональные метаданные;
- model features, если они содержат чувствительную информацию.

## 6. Temporary files

Если runtime декодирует аудио во временный файл:

- использовать отдельную временную директорию;
- генерировать безопасное имя;
- не доверять исходному filename как пути;
- удалять файл после обработки;
- ограничивать права доступа;
- не сохранять его в persistent container layer.

## 7. Network security

В production рекомендуется:

- закрытая internal network между integration API и runtime;
- TLS на внешнем API;
- authentication/authorization;
- firewall/network policy;
- отсутствие открытых model runtime ports в публичной сети.

## 8. Secrets

Secrets должны поступать через:

- secret manager;
- Kubernetes/Docker secrets;
- CI secret store;
- environment injection.

Они не должны находиться в source code, README, docker-compose example с реальными значениями или GitHub Actions logs.

## 9. Public/private boundary

В публичном репозитории находится **integration contract**, а не полный внутренний стек EchoStressAI.

Private runtime может содержать:

- licensed/owned model artifacts;
- private preprocessing implementation;
- compiled proprietary modules;
- внутренние model configs.

При этом публичный API остаётся стабильным.

## 10. Security review перед каждым merge

Перед merge в public `main` проверить:

```bash
git diff main...HEAD
```

и отдельно поискать:

```text
.wav .mp3 .flac .zip .ipynb .pt .pth .joblib .pkl .parquet
password token secret api_key bearer
Оператор client customer phone email passport
```

Поиск не заменяет ручной review.

## 11. Incident response

Если закрытые данные случайно попали в public Git:

1. немедленно считать их скомпрометированными;
2. остановить дальнейшие merge/release;
3. отозвать секреты/ключи, если они были опубликованы;
4. оценить необходимость удаления Git history;
5. уведомить ответственных за данные;
6. только после remediation продолжать работу.

Простого `git rm` недостаточно для уже опубликованного секрета.
