# CASE 1 · Validation Evidence Report

Status: **current public-safe validation evidence**  
Evidence cutoff: **2026-09-14**

## 1. Scope

This report documents aggregate validation evidence that can be safely attached to the final CASE 1 claim without publishing bank-level rows, transcripts, model weights, exact thresholds or proprietary feature engineering.

Exact PRIMARY model identity:

```text
CASE1_INDUCTIVE_CDF_PRIMARY_V1
```

Target role and horizon:

```text
role: CLIENT
analysis_horizon_sec: 60
```

The score is a **ranking/model signal**, not a calibrated probability of fraud or coercion.

## 2. Frozen validation results

| Metric | Value |
|---|---:|
| PR AUC | **0.3654** |
| ROC AUC | **0.7569** |
| Weighted F1 | **0.8190** |
| Positive F1 | **0.3188** |
| Positive precision | **0.4400** |
| Positive recall | **0.2444** |
| Balanced accuracy | **0.5965** |

The summary comes from the frozen outer-validation procedure associated with this exact PRIMARY identity. These values must not be transferred to a different model or to a legacy/operator-side scorer.

## 3. Relation to the GPB criterion

PR AUC is the primary CASE 1 metric. The specification also uses ROC AUC as an additional metric with a 0.75 reference criterion.

For this frozen PRIMARY:

```text
ROC AUC = 0.7569
```

Therefore the frozen validation result exceeds the 0.75 ROC AUC reference criterion on the declared validation protocol.

This does **not** mean that 75.69% of calls are classified correctly.

## 4. Safe-negative validation

| Metric | Value |
|---|---:|
| Median safe-negative precision | **1.0000** |
| Median coverage | **0.1779** |
| Median positive retention | **1.0000** |
| Worst positive retention | **0.9778** |

The stage is intentionally conservative. This is validation evidence, not a guarantee on a new deployment domain; the exact operating threshold is not part of the public report.

## 5. Evidence sufficiency

CASE 1 separates score from evidence sufficiency. If the first 60 seconds contain too little useful CLIENT speech, the correct product outcome is a limited/insufficient-evidence state rather than automatic low risk.

## 6. Shortcut control

A stronger operator/workflow-related signal was observed during research, but it is **not** used as the final client-state claim because of shortcut risk. The public release therefore keeps the bank-safe CLIENT-oriented PRIMARY even though its headline PR AUC is more modest.

## 7. CONTROL semantics

CONTROL predictions may be used for operational/error analysis, but without ground-truth labels they are **not** used to publish PR AUC / ROC AUC. No CONTROL result should be presented as hidden-test performance without labels and a defined protocol.

## 8. Public-safety boundary

This report excludes bank identifiers, row-level predictions, transcripts, exact thresholds, vectorizers/scalers/imputers, coefficients/weights, the internal anxiety formula, private artifact paths/hashes, and integral/fusion/personal-baseline logic.

## 9. Release-level evidence still required

```text
[ ] immutable public commit/tag fixed
[ ] exact CASE 1 runtime artifact identity recorded
[ ] artifact integrity / frozen smoke parity PASS
[ ] 60-sec no-future-data contract PASS
[ ] evidence/insufficient-data behavior PASS
[ ] end-to-end UI → API → runtime smoke PASS
[ ] container/image digest recorded
[ ] target-hardware latency/resource evidence recorded
```

Until these are frozen, this report is validation evidence for the model identity above, not a declaration that the complete final deployment snapshot is frozen.