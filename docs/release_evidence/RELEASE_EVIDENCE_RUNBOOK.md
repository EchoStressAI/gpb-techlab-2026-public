# Release Evidence Runbook

Этот runbook описывает, как превратить уже существующий runtime acceptance в публично проверяемое release evidence без переноса private engineering details в public Git.

## 1. Что уже есть

Public repository уже фиксирует:

- точные PRIMARY model IDs;
- CASE 1 / CASE 2 aggregate validation results;
- analysis horizons 60/180 sec;
- public-safe model semantics;
- claim boundaries.

Источник runtime должен дополнительно выдать **customer-safe external evidence JSON** для конкретного собранного image/release candidate.

## 2. Что НЕ копировать в public repo

Нельзя переносить:

- internal release evidence;
- private Git commit/branch source provenance;
- private bundle names/hashes, если они не предназначены для external handover;
- local filesystem paths;
- hostnames/IP;
- per-file proprietary model hashes;
- credentials/tokens;
- row-level predictions;
- bank identifiers/transcripts.

В public evidence попадает только специально сформированная customer projection.

## 3. Проверка customer-safe release evidence

После получения внешнего JSON:

```bash
python scripts/validate_customer_release_evidence.py path/to/customer.evidence.json \
  --profile functional \
  --output docs/release_evidence/validated_release_summary.json
```

`functional` требует:

- `acceptance.status = PASS`;
- functional/protected release gate;
- exact CASE 1 / CASE 2 model IDs;
- построенный Docker TAR;
- successful delivery audit;
- zero audit violations.

Для финального source-hardened handover:

```bash
python scripts/validate_customer_release_evidence.py path/to/customer.evidence.json \
  --profile final \
  --output docs/release_evidence/validated_release_summary.json
```

`final` дополнительно требует:

- protected acceptance mode;
- `source_hardening_passed = true`;
- immutable `release_id`;
- non-empty container `image_digest`.

Важно: успешная проверка customer evidence не заменяет A100 benchmark, full on-prem E2E или human explainability study. Это отдельные evidence classes.

## 4. Human explainability ≥80%

Техническая XAI-реализация сама по себе не доказывает human criterion. Текущий frozen HR protocol использует четыре вопроса по шкале 1–5.

Файлы:

- [EXPLAINABILITY_STUDY_RUNBOOK.md](EXPLAINABILITY_STUDY_RUNBOOK.md) — порядок freeze → safe case pack → blind review → scoring → versioned report;
- [EXPLAINABILITY_REVIEWER_FORM.md](EXPLAINABILITY_REVIEWER_FORM.md) — единая форма для HR reviewer;
- `EXPLAINABILITY_CASE_PACK_TEMPLATE.csv` — безопасная мета-структура review cases без bank IDs/ground truth;
- `EXPLAINABILITY_ACCEPTANCE_TEMPLATE.csv` — структура ответов для расчёта.

Обязательные поля CSV ответов:

- `respondent_id` — псевдоним/анонимизированный ID HR-респондента;
- `explanation_case_id` — безопасный review-case ID;
- `case_id`;
- `q1_result_clarity` — понятность результата, 1–5;
- `q2_feature_clarity` — понятность факторов, 1–5;
- `q3_actionability` — достаточность для следующего действия, 1–5;
- `q4_safety_clarity` — понятность, что signal ≠ диагноз/автоматическое HR-решение, 1–5;
- `comments` — опционально.

Frozen основной indicator:

```text
accepted respondent-case rating = Q2 >= 4 AND Q3 >= 4

Explainability Acceptance Rate =
  accepted respondent-case ratings
  / all valid respondent-case ratings
```

PASS по критерию:

```text
Explainability Acceptance Rate >= 0.80
```

Подсчёт:

```bash
python scripts/score_explainability_acceptance.py responses.csv \
  --target 0.80 \
  --output docs/release_evidence/explainability_acceptance_summary.json
```

Скрипт дополнительно выводит:

- число уникальных HR respondents;
- число explanation cases;
- число валидных respondent-case ratings;
- распределение оценок по респондентам;
- Q1/Q2/Q3/Q4 rate `>=4`, mean и median;
- основной acceptance rate;
- Wilson 95% CI для основного acceptance rate.

ТЗ не задаёт минимальный sample size, поэтому обязательный порог числа респондентов не придумывается. Маленькая выборка должна быть прямо указана как ограничение.

## 5. A100 / target-hardware evidence

До фактического запуска на целевой конфигурации остаётся `PENDING`.

В public report после измерения можно публиковать только безопасные агрегаты:

```text
hardware class
runtime release id
CASE 1 wall-clock latency summary
CASE 2 wall-clock latency summary
peak VRAM
peak RAM
cold/warm distinction
pass/fail against declared resource/timing criteria
```

Не требуется публиковать private model paths, exact internal stage timings или proprietary artifact layout.

В source/runtime repository подготовлен отдельный measured collector. Его customer-safe output должен быть просмотрен перед переносом в public evidence.

## 6. Full E2E evidence

Финальный E2E должен связывать один и тот же release candidate:

```text
frontend
→ public/integration API
→ CASE 1 / CASE 2 runtime
→ PRIMARY result
→ public-safe UI projection
```

Для evidence фиксируются:

- public repo snapshot/tag;
- release ID / image digest;
- exact model IDs;
- test timestamp;
- CASE 1 success;
- CASE 2 success;
- fail-closed/insufficient-evidence scenario;
- отсутствие forbidden/private fields в public response/UI.

## 7. Сборка единого public manifest из измеренного evidence

Когда есть:

1. customer-safe release acceptance JSON;
2. runtime/hardware evidence JSON;
3. при необходимости explainability summary;

их можно связать одной командой:

```bash
python scripts/assemble_public_release_manifest.py \
  --customer-evidence customer.evidence.json \
  --runtime-evidence runtime_evidence.json \
  --public-commit <public-main-sha> \
  --output final_release_manifest.json
```

Для строгого protected release:

```bash
python scripts/assemble_public_release_manifest.py \
  --customer-evidence customer.evidence.json \
  --runtime-evidence runtime_evidence.json \
  --explainability-summary explainability_acceptance_summary.json \
  --public-commit <public-main-sha> \
  --public-tag <approved-tag> \
  --require-protected \
  --require-image-digest \
  --require-a100 \
  --require-human-xai \
  --output final_release_manifest.json
```

Каждый `--require-*` — fail-closed gate. Если evidence отсутствует, output получает `INCOMPLETE`, а команда возвращает ненулевой exit code.

Это позволяет не путать два состояния:

```text
технически измерили только то, что уже можем → manifest с ограниченным набором gates
финальная конкурсная/защищённая поставка → строгие required gates
```

## 8. Когда PRE_RELEASE_MANIFEST становится final

`PRE_RELEASE_MANIFEST.json` нельзя просто переименовать вручную.

Final snapshot возможен только после появления измеренных значений для обязательных release gates. Тогда создаётся новый immutable snapshot с:

```text
public_snapshot_commit/tag
integration API version
CASE 1 model_id
CASE 2 model_id
release_id
container image digest
CI run
validation evidence IDs
resource benchmark result
E2E result
human explainability result (если критерий заявляется выполненным)
```

До этого `PENDING` остаётся корректным статусом.