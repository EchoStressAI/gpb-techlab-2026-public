# Public Hygiene Gate

## 1. Назначение

Поскольку repository публичный, случайный commit чувствительного файла опаснее обычной ошибки CI. Поэтому public CI начинается с отдельного fail-closed hygiene gate:

```bash
python scripts/check_public_hygiene.py .
```

## 2. Что проверяется автоматически

### Запрещённые artifact types

Gate блокирует типы файлов, которые не должны попадать в этот public submission по умолчанию:

```text
audio
research notebooks
model weights/checkpoints
joblib/pickle
parquet
archives
```

### Secret-like file names

Например:

```text
.env
.htpasswd
id_rsa
credentials.json
service-account.json
```

### Brand/trademark assets

Банковские логотипы и иные сторонние brand assets не хранятся в public Git по умолчанию. Текстовое указание на конкурсный кейс допустимо; публикация конкретного графического asset требует отдельного подтверждения прав/разрешения.

### Sensitive text markers

Проверяются некоторые очевидные сигнатуры:

- private-key headers;
- GitHub token patterns;
- internal Colab Drive path marker;
- live-looking deployment host markers, для которых в public source следует использовать placeholder.

### Relative Markdown links

Gate проверяет, что относительные ссылки в `.md` не ведут на отсутствующие файлы и не выходят за пределы repository.

## 3. Что gate НЕ гарантирует

Автоматическая проверка не может доказать отсутствие всех чувствительных данных.

Она не заменяет ручной review для:

- персональных данных в обычном тексте;
- скриншотов;
- завуалированных model secrets;
- лицензирования сторонних материалов;
- слишком подробной proprietary methodology;
- агрегатов с риском деанонимизации;
- commit/PR titles and messages.

## 4. Важно: Git history тоже публична

Проверка рабочего дерева не очищает уже опубликованную историю. В публичном repository видны не только текущие файлы, но и commit messages, PR descriptions и ранее опубликованные blobs.

Поэтому нельзя писать в commit/PR metadata:

- реальные production/staging hostnames и IP;
- пароли, токены, credential hashes;
- внутренние пути/идентификаторы инфраструктуры;
- названия закрытых секретных артефактов, если они сами по себе чувствительны.

Если такой infrastructure identifier уже был опубликован, обычный последующий commit его не удаляет из истории. Практическая мера по умолчанию — считать значение раскрытым и заменить/отключить его, если оно ещё активно. Переписывание публичной истории требует отдельного осознанного решения владельцев репозитория и не выполняется автоматически.

## 5. Почему forbidden list строгий

Внутренний project repo может законно содержать `.pt`, `.joblib`, `.parquet` и notebooks. Но public submission использует противоположный default:

> artifact запрещён, пока отдельно не доказано, что он действительно должен быть публичным.

Если позже понадобится публичный model artifact, policy и checker меняются отдельным осознанным PR.

## 6. Markdown link check

Документация стала значительной частью submission. Broken links ухудшают проверяемость проекта, поэтому они считаются CI error.

External `http/https` links hygiene gate не проверяет на сетевую доступность — только local relative links.

## 7. CI order

```text
checkout
→ public hygiene
→ dependency install
→ pytest
→ import smoke
```

Hygiene запускается до установки зависимостей, чтобы потенциально опасный repository state был обнаружен как можно раньше.

## 8. Local preflight

Перед PR:

```bash
python scripts/check_public_hygiene.py .
pytest -q
```

## 9. Fail-safe rule

Если checker дал false positive, не обходить его случайным rename/исключением. Сначала определить, должен ли файл вообще быть публичным.

Public-safety policy: [PUBLIC_REPOSITORY_POLICY.md](PUBLIC_REPOSITORY_POLICY.md).
