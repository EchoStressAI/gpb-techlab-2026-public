# Release Evidence Templates

Шаблоны в этом каталоге нужны для фиксации **конкретного evaluator/deployment snapshot**, а не для описания проекта в общем виде.

## Состав

- [RUNTIME_MANIFEST_TEMPLATE.json](RUNTIME_MANIFEST_TEMPLATE.json) — идентичность public code, case runtimes, model IDs, container digests, resource/validation evidence.
- [VALIDATION_REPORT_TEMPLATE.md](VALIDATION_REPORT_TEMPLATE.md) — version-specific model validation: dataset roles, grouping, metrics, leakage/shortcut audit, limitations, approved claim.
- [RESOURCE_BENCHMARK_REPORT_TEMPLATE.md](RESOURCE_BENCHMARK_REPORT_TEMPLATE.md) — 1×A100 / latency / VRAM / on-prem benchmark.
- [EXPLAINABILITY_ACCEPTANCE_REPORT_TEMPLATE.md](EXPLAINABILITY_ACCEPTANCE_REPORT_TEMPLATE.md) — human acceptance по критерию объяснимости ≥80%.

## Правило

Перед заполнением публичной копии удалить/не включать:

- банковские file/operator IDs;
- реальные транскрипты;
- secrets/credentials;
- локальные filesystem paths;
- exact proprietary coefficients/features;
- row-level predictions, если их публикация отдельно не разрешена.

Заполненный report должен быть связан с конкретным commit/tag/model_id. Пустой шаблон сам по себе не является evidence.