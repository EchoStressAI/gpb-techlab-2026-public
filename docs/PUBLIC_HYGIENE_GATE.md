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
id_rsa
credentials.json
service-account.json
```

### Sensitive text markers

Проверяются некоторые очевидные сигнатуры:

- private-key headers;
- GitHub token patterns;
- internal Colab Drive path marker.

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
- агрегатов с риском деанонимизации.

## 4. Почему forbidden list строгий

Внутренний project repo может законно содержать `.pt`, `.joblib`, `.parquet` и notebooks. Но public submission использует противоположный default:

> artifact запрещён, пока отдельно не доказано, что он действительно должен быть публичным.

Если позже понадобится публичный model artifact, policy и checker меняются отдельным осознанным PR.

## 5. Markdown link check

Документация стала значительной частью submission. Broken links ухудшают проверяемость проекта, поэтому они считаются CI error.

External `http/https` links hygiene gate не проверяет на сетевую доступность — только local relative links.

## 6. CI order

```text
checkout
→ public hygiene
→ dependency install
→ pytest
→ import smoke
```

Hygiene запускается до установки зависимостей, чтобы потенциально опасный repository state был обнаружен как можно раньше.

## 7. Local preflight

Перед PR:

```bash
python scripts/check_public_hygiene.py .
pytest -q
```

## 8. Fail-safe rule

Если checker дал false positive, не обходить его случайным rename/исключением. Сначала определить, должен ли файл вообще быть публичным.

Public-safety policy: [PUBLIC_REPOSITORY_POLICY.md](PUBLIC_REPOSITORY_POLICY.md).
