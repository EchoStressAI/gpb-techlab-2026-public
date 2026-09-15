# Validation Evidence Index

Этот документ объясняет, **каким типом evidence подтверждается каждое утверждение о решении**, и предотвращает смешение CI, model performance и экспертной интерпретации.

Он намеренно не придумывает отсутствующие metrics: конкретные числа публикуются только вместе с `model_id`, protocol и version-specific report.

## 1. Четыре уровня evidence

### A. Integration evidence

Подтверждает, что публичный software contract работает технически:

- CI;
- unit/contract tests;
- Docker build;
- health/readiness;
- fixed-horizon validation;
- fail-closed behavior;
- frontend build/typecheck.

Это **не** подтверждение ML-quality.

### B. Model-performance evidence

Подтверждает качество конкретной serving/model версии:

- PR AUC / ROC AUC;
- Precision / Recall / error rates;
- operating point;
- operator-balanced analysis;
- uncertainty / sample size;
- quality-conditioned performance;
- hold-out / leakage controls.

Каждая метрика должна быть привязана к version identity.

### C. Semantic / expert evidence

Подтверждает, что результат интерпретируется содержательно корректно:

- expert review;
- disagreement analysis;
- temporal-window audit;
- construct validity discussion;
- quality/evidence review;
- human XAI acceptance.

Expert review не подменяет банковскую ground truth.

### D. Deployment evidence

Подтверждает, что конкретный release работает в целевой topology:

- on-prem smoke;
- connected runtime readiness;
- resource compatibility;
- container digest/version;
- safe upload/result cycle;
- frontend ↔ API ↔ runtime end-to-end path.

## 2. CASE 1 evidence map

| Утверждение | Нужный evidence |
|---|---|
| Рабочее окно — первые 60 сек | contract test + E2E smoke |
| Анализируется клиентская сторона | runtime contract + product smoke |
| PRIMARY выдаёт model signal | connected runtime + model identity |
| PR AUC / ROC AUC | version-specific validation report |
| Operating point | frozen validation protocol |
| Insufficient evidence обрабатывается отдельно | contract/UI smoke |
| Supporting state не равен доказательству воздействия | Model Card + semantic review |
| Результат полезен в anti-fraud flow | product/operational validation, не одна ML metric |

## 3. CASE 2 evidence map

| Утверждение | Нужный evidence |
|---|---|
| Рабочее окно — первые 180 сек | contract test + E2E smoke |
| Анализируется речь сотрудника | runtime contract + product smoke |
| Score — relative model signal, не diagnosis | Model Card + UI contract |
| ROC AUC | version-specific validation report |
| Employee-period/history semantics | temporal/grouped validation |
| Quality зависит от speech coverage | quality analysis + expert review |
| XAI понятен пользователю | human acceptance protocol |
| Voice/emotion signal != burnout construct | scientific rationale + expert review |

## 4. Minimum metadata для любой опубликованной ML metric

Любое число, заявленное как performance, должно сопровождаться:

```text
case_id
model_id
runtime/preprocessing version
dataset role / split
sample size
analysis horizon
metric definition
quality inclusion/exclusion rule
leakage/grouping rule
calculation date
```

Если этих полей нет, число следует считать исследовательским контекстом, а не release claim.

## 5. Что хранится в public repo

Публично безопасно хранить:

- validation protocol;
- metric definitions;
- methodology;
- anonymized aggregate results, если их публикация разрешена;
- public-safe expert conclusions;
- version identity;
- limitations.

Не публикуются по умолчанию:

- банковские row-level predictions;
- operator/file IDs;
- приватные экспертные карточки;
- реальные транскрипты;
- model weights/feature tables;
- exact proprietary decision formulas.

## 6. Как reviewer должен читать отсутствие числа

Отсутствие конкретной метрики в general public documentation **не означает отсутствие validation**. Оно означает, что performance claim должен быть привязан к конкретной model/runtime версии и соответствующему report.

Это особенно важно, когда public integration layer развивается независимо от frozen model artifact.

## 7. Какие документы связаны с evidence

- [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md) — правила проверки;
- [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md) — scope CASE 1;
- [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md) — scope CASE 2;
- [EXPERT_REVIEW_AND_VALIDATION.md](EXPERT_REVIEW_AND_VALIDATION.md) — expert-review methodology;
- [CASE2_EXPERT_REVIEW_LESSONS.md](CASE2_EXPERT_REVIEW_LESSONS.md) — публичные выводы error analysis;
- [QUALITY_AND_EVIDENCE.md](QUALITY_AND_EVIDENCE.md) — data-quality semantics;
- [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md) — связь с требованиями;
- [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md) — pre-release check.

## 8. Release decision rule

Model/runtime version должна считаться готовой к заявлению конкретного качества только когда согласованы:

```text
frozen model identity
+ frozen validation protocol
+ leakage controls
+ version-specific metrics
+ quality/error analysis
+ known limitations
+ deployment smoke
```

Ни зелёный CI, ни один удачный demo-call не заменяют этот набор evidence.