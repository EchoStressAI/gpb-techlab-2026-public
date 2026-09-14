# Troubleshooting

## 1. `/health` = 200, `/readiness` = 503

Это нормальная ситуация, если integration API запущен, но один или оба model runtime не подключены.

Проверьте:

```bash
echo "$GPB_CASE1_RUNTIME_URL"
echo "$GPB_CASE2_RUNTIME_URL"
```

Затем отдельно:

```bash
curl -i "$GPB_CASE1_RUNTIME_URL/health"
curl -i "$GPB_CASE2_RUNTIME_URL/health"
```

## 2. `MODEL_RUNTIME_UNAVAILABLE`

Возможные причины:

- URL не задан;
- DNS/service name недоступен;
- runtime не запущен;
- timeout;
- runtime вернул 5xx;
- network policy блокирует соединение.

Integration API намеренно не подставляет fallback score.

## 3. `MODEL_RUNTIME_CONTRACT_ERROR`

Runtime ответил, но нарушил контракт.

Проверить:

- `case_id`;
- `analysis_horizon_sec`;
- наличие `model_id`;
- наличие `status`;
- JSON format.

## 4. Case mismatch

Если CASE 1 endpoint/runtime отвечает `CASE_2` или наоборот, результат блокируется.

Не исправлять это изменением case id только на integration layer: сначала проверить routing runtime.

## 5. Horizon mismatch

Ожидается:

```text
CASE_1 = 60
CASE_2 = 180
```

Если runtime сообщает другое значение, это contract error.

## 6. Upload rejected

### Empty upload

HTTP 400.

### Too large

HTTP 413. Public integration API принимает до 200 MiB.

Если production требует больший размер, лимит необходимо менять осознанно вместе с reverse-proxy limits и memory policy.

## 7. Docker видит runtime на host, но соединения нет

`localhost` внутри контейнера — это сам контейнер, а не host.

Используйте общую Docker network или подходящий host gateway/service name.

Пример общей сети:

```text
api -> http://case1-runtime:8101
api -> http://case2-runtime:8102
```

## 8. CI падает, локально работает

Проверьте:

- используется ли чистое окружение;
- нет ли незакоммиченного локального файла;
- не зависит ли тест от private artifact;
- нет ли случайного import из sibling private repo;
- соответствует ли Python version.

Public CI не должен требовать доступа к private dataset/model storage.

## 9. В UI появляется score при `MODEL_RUNTIME_UNAVAILABLE`

Это ошибка frontend/integration. При runtime unavailable нельзя показывать cached/default score как текущий inference.

Рекомендуется явно отображать:

```text
Модель недоступна / результат не рассчитан
```

## 10. Score есть, но quality ограничен

Это не техническая ошибка. Интерфейс должен показать оба факта:

- score технически рассчитан;
- evidence/quality ограничивает интерпретацию.

Не заменять limited quality на «низкий риск».

## 11. Экспертный комментарий относится к эпизоду после model horizon

Не использовать поздний эпизод как прямое объяснение раннего score.

CASE 1: после 60 сек — вне окна.

CASE 2: после 180 сек — вне окна.

## 12. Эмоциональный класс выглядит психологически слишком сильным

Не интерпретировать label буквально. Это технический output representation.

В публичном объяснении лучше говорить «model component associated with ...», а не утверждать психологическое состояние.

## 13. Нужно проверить публичную безопасность ветки

Перед merge:

```bash
git diff main...HEAD --stat
git diff main...HEAD
```

Особое внимание файлам:

```text
*.wav *.mp3 *.flac *.zip *.ipynb *.pt *.pth *.pkl *.joblib *.parquet .env
```

## 14. Когда открывать issue

Issue полезен, если ошибка воспроизводится на публичном integration layer без закрытых данных.

Не публикуйте в issue реальные аудиофайлы, персональные транскрипты, секреты или приватные runtime logs с чувствительными данными.
