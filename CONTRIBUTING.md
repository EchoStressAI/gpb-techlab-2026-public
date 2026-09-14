# Contributing

Спасибо за интерес к проекту EchoStressAI · GPB TechLab 2026.

## Главное правило

Этот repository **public**. Любой commit, branch, Pull Request и discussion следует считать публичным с момента создания.

Не добавляйте сюда реальные банковские данные, персональные данные, приватные model artifacts, закрытые research notebooks или proprietary универсальную методологию EchoStressAI.

## Workflow

Изменения вносятся через:

```text
branch → commit → Pull Request → CI → merge
```

Не используйте force-push в `main` и не переписывайте публичную историю без отдельной необходимости.

## Перед PR

Проверьте:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
pytest -q
```

Также просмотрите diff:

```bash
git diff main...HEAD
```

## Public-safety review

Особенно внимательно проверяйте добавление файлов типов:

```text
*.wav *.mp3 *.flac *.zip *.ipynb *.pt *.pth *.pkl *.joblib *.parquet
```

Такие файлы не должны добавляться автоматически только потому, что они нужны во внутреннем research repo.

## Code style

- Делайте интерфейсы явными и небольшими.
- Не генерируйте fake score при недоступности runtime.
- Сохраняйте fixed horizons CASE 1=60 sec, CASE 2=180 sec.
- Case-specific model logic не размазывайте по integration layer.
- Новые runtime поля документируйте.
- Ошибки контракта должны быть явными.
- Тесты не должны зависеть от private datasets.

## Documentation

Если PR меняет endpoint, env var, case semantics или deployment, обновите соответствующий документ в `docs/`.

Если изменение влияет на интерпретацию результата, обновите Model Card и/или `LIMITATIONS_AND_RESPONSIBLE_USE.md`.

## Tests

Предпочтительны synthetic fixtures и deterministic contract tests.

CI public repo не должен требовать credentials к private storage.

## Pull Request description

Укажите:

1. что изменено;
2. зачем;
3. меняется ли public contract;
4. какие тесты выполнены;
5. затрагивает ли изменение public/private boundary;
6. нужна ли новая runtime/model version.

## Sensitive findings

Уязвимости и утечки не обсуждайте с чувствительными примерами в публичном issue. См. [SECURITY.md](SECURITY.md).
