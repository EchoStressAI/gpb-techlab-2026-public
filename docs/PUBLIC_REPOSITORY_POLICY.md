# Public repository policy

Этот репозиторий публичный. **Любая ветка, commit, Pull Request, issue и его вложения также следует считать публичными.**

Публичность используется для прозрачности конкурсного integration layer и не означает, что весь внутренний продукт EchoStressAI или все исследовательские материалы должны находиться в GitHub.

## Разрешено публиковать

- API и integration code;
- case routing и фиксированные аналитические окна;
- deployment-конфигурацию без секретов;
- публичные контракты входов/выходов;
- smoke/contract tests на синтетических данных;
- описание архитектуры на уровне компонентов;
- Model Cards, validation protocol и responsible-use documentation;
- идентификаторы публично безопасных версий;
- эксплуатационную документацию;
- aggregate research conclusions, если они не раскрывают закрытые данные/IP.

## Запрещено публиковать

- аудио/транскрипты/метки Газпромбанка;
- персональные данные;
- токены, пароли, `.env`, private keys, cookies;
- приватные URL с credentials;
- research notebooks и сырые закрытые результаты экспериментов;
- training datasets и промежуточные private feature tables;
- private model artifacts без отдельного решения владельца IP;
- universal integral methodology EchoStressAI;
- exact proprietary fusion-правила/коэффициенты;
- personal-baseline и private longitudinal rules;
- закрытые внутренние Drive/storage paths, если они раскрывают инфраструктуру;
- материалы, лицензия которых не разрешает публичное распространение.

## Правило изменений

Для `main` используется:

```text
отдельная branch → commits → Pull Request → CI → merge
```

Прямые рабочие commits в `main` не используются.

Для этого public submission владелец репозитория может merge PR после собственных проверок и зелёного CI; отдельный внешний reviewer не является техническим требованием каждого изменения.

## Fail-safe правило публикации

Если есть сомнение, можно ли публиковать файл, файл **не добавляется** до проверки public/private boundary.

Особенно внимательно проверять:

```text
.wav .mp3 .flac .zip .ipynb .pt .pth .pkl .joblib .parquet .env
```

## Git history

Нельзя рассчитывать на «потом удалим». Даже удалённый файл мог уже попасть в:

- Git history;
- clone;
- fork;
- cache;
- CI log/artifact.

Поэтому sensitive material не должен коммититься даже во временную public branch.

## Pull Request content

Не вставлять в PR description/comments:

- реальные транскрипты;
- банковские filenames, если они чувствительны;
- секреты;
- private traceback с credentials/paths;
- screenshots с персональными данными.

## Rights and licensing

Public visibility не является автоматической open-source лицензией. См. [../NOTICE.md](../NOTICE.md).

Сторонние компоненты остаются под своими лицензиями.

## Related documents

- [IP_AND_PUBLIC_BOUNDARY.md](IP_AND_PUBLIC_BOUNDARY.md)
- [DATA_PRIVACY_SECURITY.md](DATA_PRIVACY_SECURITY.md)
- [../SECURITY.md](../SECURITY.md)
- [../CONTRIBUTING.md](../CONTRIBUTING.md)
