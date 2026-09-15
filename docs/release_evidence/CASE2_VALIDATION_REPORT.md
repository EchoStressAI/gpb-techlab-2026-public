# CASE 2 · Validation Evidence Report

Status: **current public-safe validation evidence**  
Evidence cutoff: **2026-09-14**

## 1. Scope

This report records the aggregate validation evidence for the current CASE 2 PRIMARY without publishing bank-level rows, employee identifiers, exact coefficients or private feature tables.

Exact PRIMARY model identity:

```text
CASE2_OPEN_ACOUSTIC11_ORIENTED_V1
```

Analysis role and horizon:

```text
role: support employee
analysis_horizon_sec: 180
validated_unit: employee_period
```

The output is a **relative model/state signal**, not a calibrated probability of burnout and not a medical or HR diagnosis.

## 2. Validation protocol

Primary validation uses employee-grouped evaluation rather than a random split of calls:

```text
true nested employee-LOPO
orientation selected inside employee-LOPO
```

This design reduces leakage of stable individual voice characteristics between train and validation folds.

## 3. Frozen aggregate validation results

| Metric | Value | Interpretation |
|---|---:|---|
| Period ROC AUC | **0.8701** | primary validated unit |
| Period PR AUC | **0.8060** | primary validated unit |
| Projected call ROC AUC | **0.9263** | secondary projection |
| Projected call PR AUC | **0.8251** | secondary projection |
| Operator-equal ROC AUC | **0.8818** | balanced descriptive/validation view |
| Mean transition AUC | **0.4375** | limitation signal for within-person dynamics |

The primary release claim should use the employee-period metrics, not the projected call metrics.

## 4. Relation to the GPB criterion

The CASE 2 specification uses ROC AUC ≥ 0.75 as a quality criterion.

For the declared validated unit:

```text
Period ROC AUC = 0.8701
```

Therefore the current frozen validation result exceeds the 0.75 criterion on the employee-period protocol.

This does not imply that one call diagnoses burnout or that the score is a probability.

## 5. Validation geometry

Public-safe aggregate dataset geometry for this evidence snapshot:

| Quantity | Value |
|---|---:|
| Calls | **98** |
| Calls with acoustic features | **95** |
| Employee-periods | **25** |
| Employees | **11** |
| Positive calls | **33** |

The small number of employees is an important limitation on external generalization and is one reason why additional bank/population validation remains necessary.

## 6. Within-person limitation

The mean transition AUC is substantially weaker than the employee-period discrimination metrics.

Accordingly, the current evidence supports the model as a relative employee-period/state risk signal more strongly than as a proven detector of short-term within-person change.

The public product should not claim that a single change between two calls is a validated change in burnout.

## 7. Explainability evidence

Technical XAI is available for the current model family, but the specification's human criterion — explanation clarity/availability ≥80% — requires a separate reviewer/HR acceptance study.

Current status:

```text
TECHNICAL XAI = available
HUMAN EXPLAINABILITY >=80% = not yet evidenced
```

The presence of an XAI panel must not be presented as proof that the 80% human-acceptance criterion has already been met.

## 8. Emotion/state vs burnout construct

Acoustic or emotional representations are supporting measurements, not direct diagnoses. Negative affect, irritation, fatigue and burnout-related constructs may overlap but are not interchangeable.

The current CASE 2 PRIMARY is therefore described as a speech-based relative state/risk signal with explicit quality and responsible-use constraints.

## 9. Public-safety boundary

This report excludes employee/file identifiers, row-level predictions, transcripts, exact feature names where they reveal the serving model, standardized feature values, coefficients/intercept, scaler/imputer parameters, private reference distributions, thresholds and integral/fusion logic.

## 10. Release-level evidence still required

```text
[ ] immutable public commit/tag fixed
[ ] exact CASE 2 runtime artifact identity recorded
[ ] runtime/model manifest PASS
[ ] 180-sec horizon contract PASS
[ ] end-to-end UI → API → runtime smoke PASS
[ ] target-hardware latency / peak VRAM / RAM measured
[ ] 1×A100 compatibility evidenced if required by final acceptance
[ ] human explainability acceptance study completed
[ ] full on-prem/offline acceptance completed
[ ] container/image digest recorded
```

Until these are frozen, this report is model-validation evidence, not a declaration that the complete deployment snapshot has passed all release gates.