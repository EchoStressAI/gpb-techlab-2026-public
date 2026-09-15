# Dependencies & License Governance

Этот документ фиксирует публично видимые зависимости integration/frontend слоя и правила их проверки перед конкретным release. Он не является юридическим заключением и не заменяет release-level SBOM/license scan.

## 1. Public Python layer

Источник: `pyproject.toml`.

Прямые runtime-зависимости:

```text
fastapi >=0.115,<1
httpx >=0.27,<1
uvicorn[standard] >=0.30,<1
python-multipart >=0.0.9,<1
```

Dev/test:

```text
pytest >=8,<9
```

Важно: `pyproject.toml` задаёт диапазоны версий, а не полный lock конкретного релиза. Поэтому один только `pyproject.toml` не является достаточным доказательством bit-for-bit воспроизводимости production image.

## 2. Public frontend layer

Источник: `frontend/package.json` + `frontend/package-lock.json`.

Прямые runtime-зависимости:

```text
react
react-dom
react-router-dom
```

Build/dev:

```text
@types/react
@types/react-dom
@vitejs/plugin-react
typescript
vite
```

`package-lock.json` фиксирует resolved dependency graph, integrity hashes и содержит license metadata для пакетов, где она опубликована в npm metadata.

## 3. Что должно фиксироваться для конкретного release

Для evaluator/deployment snapshot желательно сохранять:

```text
public repository commit/tag
Python version
resolved Python package versions
frontend lockfile commit
Node/npm version
container image digest
SBOM artifact id/path
license scan date
known license exceptions, если есть
```

## 4. Почему runtime dependencies разделены

Public integration repository намеренно не объявляет полный dependency graph закрытого model runtime.

CASE-specific runtime может иметь собственные зависимости:

- ML framework / CUDA runtime;
- acoustic processing libraries;
- ASR/speech encoders;
- model artifacts;
- licensed third-party components.

Их состав должен фиксироваться в version-specific runtime manifest/SBOM, но не обязан раскрываться в public Git, если это противоречит IP/licensing boundary.

## 5. Third-party model / data policy

Перед включением любого third-party model artifact, dataset fragment или proprietary SDK в поставку нужно отдельно проверить:

1. право на использование;
2. право на redistribution/on-prem delivery;
3. требования attribution/NOTICE;
4. ограничения commercial use;
5. ограничения на model output/derived artifacts;
6. требования к network access или telemetry.

Если право публикации/redistribution не подтверждено, компонент не включается в public repository по умолчанию.

## 6. Public Git ≠ open-source license

Публичная видимость repository не означает автоматически выдачу лицензии на весь проект. Repo-level rights notice описан в `NOTICE.md`.

Каждая third-party dependency при этом остаётся под своей собственной лицензией.

## 7. Recommended release checks

Перед tag/release:

```text
1. build public API image from clean checkout
2. build frontend from package-lock
3. resolve/freeze Python environment used by image
4. generate SBOM
5. scan package licenses
6. scan known vulnerabilities
7. record image digest + commit SHA
8. review NOTICE / attribution requirements
9. verify private runtime manifest separately
```

## 8. Что CI проверяет сейчас

Current public CI проверяет build/tests/public hygiene, но это **не полный license-compliance или SBOM pipeline**.

Это различие важно: зелёный CI означает, что public software contract собрался/прошёл проверки, но не заменяет release-level dependency governance.

## 9. Release evidence

Итоговая поставка/демонстрация должна позволять ответить на вопросы:

- из какого commit собран public layer;
- какие exact dependency versions попали в image;
- какие лицензии требуют attribution;
- какой runtime/model release подключён;
- какой image digest фактически запущен.

Связанный документ: `PUBLIC_RELEASE_VERSIONING.md`.