#!/usr/bin/env python3
"""Assemble a public release manifest from measured customer-safe evidence.

Inputs are deliberately external/customer-safe projections only:
- release acceptance evidence from the runtime build pipeline;
- runtime/hardware evidence from the live release candidate;
- optional human explainability acceptance summary.

The assembler does not invent missing evidence. Required conditions that are not
measured remain explicit failures/incomplete gates.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any

CASE1_MODEL_ID = "CASE1_INDUCTIVE_CDF_PRIMARY_V1"
CASE2_MODEL_ID = "CASE2_OPEN_ACOUSTIC11_ORIENTED_V1"


def load(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"File not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise SystemExit(f"Expected object in {path}")
    return payload


def git_head() -> str | None:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
    except (OSError, subprocess.CalledProcessError):
        return None
    value = result.stdout.strip()
    return value or None


def runtime_case(runtime: dict[str, Any], case_id: str) -> dict[str, Any] | None:
    for item in runtime.get("cases") or []:
        if isinstance(item, dict) and item.get("case_id") == case_id:
            return item
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Assemble public GPB release evidence manifest")
    parser.add_argument("--customer-evidence", type=Path, required=True)
    parser.add_argument("--runtime-evidence", type=Path, required=True)
    parser.add_argument("--explainability-summary", type=Path)
    parser.add_argument("--public-commit")
    parser.add_argument("--public-tag")
    parser.add_argument("--require-protected", action="store_true")
    parser.add_argument("--require-image-digest", action="store_true")
    parser.add_argument("--require-a100", action="store_true")
    parser.add_argument("--require-human-xai", action="store_true")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    customer = load(args.customer_evidence)
    runtime = load(args.runtime_evidence)
    human = load(args.explainability_summary) if args.explainability_summary else None

    failures: list[str] = []
    warnings: list[str] = []

    if customer.get("audience") != "customer":
        failures.append("customer evidence audience must be 'customer'")
    acceptance = customer.get("acceptance") or {}
    gate = customer.get("release_gate") or {}
    release_identity = customer.get("release_identity") or {}
    docker = customer.get("docker") or {}
    audit = docker.get("audit") or {}
    customer_models = customer.get("models") or {}

    if acceptance.get("status") != "PASS" or gate.get("passed") is not True:
        failures.append("customer release acceptance gate is not PASS")
    if audit.get("audit_passed") is not True or audit.get("violation_count") != 0:
        failures.append("customer delivery audit is not a clean PASS")

    if args.require_protected:
        if acceptance.get("mode") != "protected":
            failures.append("protected acceptance mode is required")
        if audit.get("source_hardening_passed") is not True:
            failures.append("source_hardening_passed=true is required")

    c1_model = (customer_models.get("case1_primary") or {}).get("model_id")
    c2_model = (customer_models.get("case2_primary") or {}).get("model_id")
    if c1_model != CASE1_MODEL_ID:
        failures.append("unexpected CASE 1 model in customer evidence")
    if c2_model != CASE2_MODEL_ID:
        failures.append("unexpected CASE 2 model in customer evidence")

    case1 = runtime_case(runtime, "CASE_1")
    case2 = runtime_case(runtime, "CASE_2")
    if not case1 or case1.get("status") != "PASS" or case1.get("model_id") != CASE1_MODEL_ID:
        failures.append("runtime CASE 1 evidence is missing or does not match PRIMARY")
    if not case2 or case2.get("status") != "PASS" or case2.get("model_id") != CASE2_MODEL_ID:
        failures.append("runtime CASE 2 evidence is missing or does not match PRIMARY")

    customer_release_id = release_identity.get("release_id")
    runtime_release_id = runtime.get("release_id")
    if customer_release_id and runtime_release_id and customer_release_id != runtime_release_id:
        failures.append("release_id mismatch between build and runtime evidence")
    release_id = customer_release_id or runtime_release_id
    if not release_id:
        warnings.append("release_id is empty")

    image_digest = release_identity.get("image_digest")
    if not image_digest:
        if args.require_image_digest:
            failures.append("immutable image_digest is required")
        else:
            warnings.append("image_digest is empty")

    a100_detected = bool((runtime.get("hardware") or {}).get("a100_detected"))
    if args.require_a100 and not a100_detected:
        failures.append("A100 evidence required but A100 was not detected on runtime host")

    human_pass = False
    human_rate = None
    if human:
        human_rate = human.get("joint_acceptance_rate")
        human_pass = human.get("status") == "PASS" and isinstance(human_rate, (int, float)) and human_rate >= 0.80
    if args.require_human_xai and not human_pass:
        failures.append("human explainability >=80% evidence required but not PASS")

    public_commit = args.public_commit or git_head()
    if not public_commit:
        warnings.append("public snapshot commit is empty")

    status = "PASS" if not failures else "INCOMPLETE"
    payload = {
        "schema_version": "1.1",
        "status": status,
        "public_snapshot": {
            "repository": "EchoStressAI/gpb-techlab-2026-public",
            "commit": public_commit,
            "tag": args.public_tag,
        },
        "release_identity": {
            "release_id": release_id,
            "image_tag": release_identity.get("image_tag"),
            "image_digest": image_digest,
            "acceptance_mode": acceptance.get("mode"),
            "delivery_audit_passed": audit.get("audit_passed"),
            "source_hardening_passed": audit.get("source_hardening_passed"),
        },
        "models": {
            "case1": {
                "model_id": CASE1_MODEL_ID,
                "analysis_horizon_sec": 60,
                "validation": {"pr_auc": 0.3654, "roc_auc": 0.7569, "weighted_f1": 0.8190},
                "runtime_wall_clock_sec": None if not case1 else case1.get("wall_clock_upload_to_done_sec"),
            },
            "case2": {
                "model_id": CASE2_MODEL_ID,
                "analysis_horizon_sec": 180,
                "validated_unit": "employee_period",
                "validation": {"roc_auc": 0.8701, "pr_auc": 0.8060, "operator_equal_roc_auc": 0.8818},
                "runtime_wall_clock_sec": None if not case2 else case2.get("wall_clock_upload_to_done_sec"),
            },
        },
        "hardware": {
            "gpu_names": (runtime.get("hardware") or {}).get("gpu_names") or [],
            "a100_detected": a100_detected,
            "case1_gpu": None if not case1 else case1.get("gpu"),
            "case2_gpu": None if not case2 else case2.get("gpu"),
        },
        "human_explainability": {
            "evidence_supplied": human is not None,
            "joint_acceptance_rate": human_rate,
            "criterion_80_percent_pass": human_pass,
        },
        "requirements": {
            "require_protected": args.require_protected,
            "require_image_digest": args.require_image_digest,
            "require_a100": args.require_a100,
            "require_human_xai": args.require_human_xai,
        },
        "failures": failures,
        "warnings": warnings,
        "claim_boundaries": {
            "analysis_horizon_is_not_wall_clock_latency": True,
            "scores_are_not_calibrated_probabilities": True,
            "case2_is_not_medical_diagnosis": True,
            "control_without_ground_truth_is_not_auc_evidence": True,
        },
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
