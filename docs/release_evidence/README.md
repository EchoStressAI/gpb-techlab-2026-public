# Release Evidence · Current Status

This directory separates **already-supported model evidence** from **release-level evidence that still has to be measured on the final deployment snapshot**.

## Already supported

### CASE 1

- model identity: `CASE1_INDUCTIVE_CDF_PRIMARY_V1`;
- CLIENT-side horizon: 60 sec;
- frozen aggregate validation: PR AUC 0.3654, ROC AUC 0.7569, weighted F1 0.8190;
- conservative safe-negative evidence: median precision 1.0000, median coverage 0.1779;
- shortcut control: stronger operator/workflow signals are not transferred to the final client-state claim;
- score is not a calibrated probability.

See [CASE1_VALIDATION_REPORT.md](CASE1_VALIDATION_REPORT.md).

### CASE 2

- model identity: `CASE2_OPEN_ACOUSTIC11_ORIENTED_V1`;
- employee-side horizon: 180 sec;
- validated unit: employee-period;
- nested employee-grouped validation: period ROC AUC 0.8701, period PR AUC 0.8060;
- operator-equal ROC AUC 0.8818;
- within-person transition behavior remains a documented limitation;
- score is not a probability or diagnosis.

See [CASE2_VALIDATION_REPORT.md](CASE2_VALIDATION_REPORT.md).

## Can be prepared now, but not honestly marked PASS yet

The draft machine-readable manifest is [PRE_RELEASE_MANIFEST.json](PRE_RELEASE_MANIFEST.json). It deliberately keeps the following fields pending until they are measured on the final release candidate:

- final public commit/tag;
- exact release runtime/container identity;
- image digest;
- resolved SBOM;
- full frontend → API → runtime E2E smoke;
- target-hardware latency / peak RAM / peak VRAM;
- 1×A100 compatibility evidence where required;
- offline/no-egress acceptance;
- human explainability acceptance result for the ≥80% criterion.

## Evidence tools already available

The repository now contains two small standard-library tools that can be used before the final snapshot exists.

### 1. Validate customer-safe runtime evidence

A runtime/release pipeline can emit a reduced external JSON containing only customer-safe release identity, model IDs and delivery-gate status. Validate it with:

```bash
python scripts/validate_customer_release_evidence.py customer.evidence.json \
  --profile functional
```

For the final source-hardened release:

```bash
python scripts/validate_customer_release_evidence.py customer.evidence.json \
  --profile final
```

The final profile additionally requires a protected acceptance mode, source-hardening PASS, release ID and immutable image digest.

### 2. Score the human explainability acceptance survey

Use [EXPLAINABILITY_ACCEPTANCE_TEMPLATE.csv](EXPLAINABILITY_ACCEPTANCE_TEMPLATE.csv) for anonymized reviewer responses and calculate the observed joint acceptance rate with:

```bash
python scripts/score_explainability_acceptance.py responses.csv \
  --target 0.80 \
  --output explainability_acceptance_summary.json
```

A single assessment is accepted only when the reviewer answers positively to both:

- explanation is understandable;
- explanation can support a decision / next action.

The script reports sample/reviewer counts and the observed rate; it does not claim that the reviewer sample is representative.

Full workflow: [RELEASE_EVIDENCE_RUNBOOK.md](RELEASE_EVIDENCE_RUNBOOK.md).

## Why these items are not filled from memory

Release evidence must identify the exact artifact that was actually executed. A metric from an earlier experiment, a development server, another GPU, or a technical XAI implementation cannot be silently promoted into evidence for the final release image.

The rule is:

```text
measured on exact release candidate → can become PASS evidence
not measured on exact release candidate → stays PENDING
```

## Public-safety rule

Public evidence may contain aggregate metrics, model IDs, horizons, validation units, CI/release identities and safe limitations. It must not contain bank row-level data, employee/customer identifiers, transcripts, secrets, local paths, raw proprietary features, coefficients, exact private thresholds or integral/fusion formulas.
