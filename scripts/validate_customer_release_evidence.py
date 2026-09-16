#!/usr/bin/env python3
"""Validate a customer-safe GPB release-evidence JSON.

The validator is intentionally limited to the external/customer projection.
It must not be pointed at internal engineering evidence containing private Git,
bundle, host or per-artifact provenance.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

CASE1_MODEL_ID = "CASE1_INDUCTIVE_CDF_PRIMARY_V1"
CASE2_MODEL_ID = "CASE2_OPEN_ACOUSTIC11_ORIENTED_V1"


def load_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"Evidence file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON: {exc}") from exc
    if not isinstance(payload, dict):
        raise SystemExit("Evidence root must be a JSON object")
    return payload


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def validate(payload: dict[str, Any], profile: str) -> dict[str, Any]:
    failures: list[str] = []
    warnings: list[str] = []

    require(payload.get("audience") == "customer", "audience must be 'customer'", failures)

    acceptance = payload.get("acceptance") or {}
    gate = payload.get("release_gate") or {}
    release_identity = payload.get("release_identity") or {}
    models = payload.get("models") or {}
    docker = payload.get("docker") or {}
    docker_tar = docker.get("tar") or {}
    docker_audit = docker.get("audit") or {}

    require(acceptance.get("status") == "PASS", "acceptance.status must be PASS", failures)
    require(
        acceptance.get("mode") in {"functional", "protected"},
        "acceptance.mode must be functional or protected",
        failures,
    )
    require(gate.get("passed") is True, "release_gate.passed must be true", failures)

    case1 = models.get("case1_primary") or {}
    case2 = models.get("case2_primary") or {}
    require(case1.get("model_id") == CASE1_MODEL_ID, "unexpected CASE 1 model_id", failures)
    require(case2.get("model_id") == CASE2_MODEL_ID, "unexpected CASE 2 model_id", failures)

    require(docker_tar.get("present") is True, "customer evidence must identify a built Docker TAR", failures)
    require(docker_audit.get("present") is True, "delivery audit must be present", failures)
    require(docker_audit.get("audit_passed") is True, "delivery audit must pass", failures)
    require(docker_audit.get("violation_count") == 0, "delivery audit must have zero violations", failures)

    if not release_identity.get("release_id"):
        warnings.append("release_id is empty")
    if not release_identity.get("image_tag"):
        warnings.append("image_tag is empty")
    if not release_identity.get("image_digest"):
        warnings.append("image_digest is empty")

    if profile == "final":
        require(bool(release_identity.get("release_id")), "final profile requires release_id", failures)
        require(bool(release_identity.get("image_digest")), "final profile requires image_digest", failures)
        require(
            acceptance.get("mode") == "protected",
            "final profile requires protected acceptance mode",
            failures,
        )
        require(
            docker_audit.get("source_hardening_passed") is True,
            "final profile requires source_hardening_passed=true",
            failures,
        )

    return {
        "status": "PASS" if not failures else "FAIL",
        "profile": profile,
        "case1_model_id": case1.get("model_id"),
        "case2_model_id": case2.get("model_id"),
        "acceptance_mode": acceptance.get("mode"),
        "release_id": release_identity.get("release_id"),
        "image_tag": release_identity.get("image_tag"),
        "image_digest": release_identity.get("image_digest"),
        "delivery_audit_passed": docker_audit.get("audit_passed"),
        "source_hardening_passed": docker_audit.get("source_hardening_passed"),
        "failures": failures,
        "warnings": warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate customer-safe GPB release evidence")
    parser.add_argument("evidence", type=Path)
    parser.add_argument(
        "--profile",
        choices=("functional", "final"),
        default="functional",
        help="functional validates a runnable audited image; final additionally requires protected source hardening and immutable release identity",
    )
    parser.add_argument("--output", type=Path, help="Optional path for a public-safe validation summary JSON")
    args = parser.parse_args()

    payload = load_json(args.evidence)
    summary = validate(payload, args.profile)

    text = json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True)
    print(text)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")

    return 0 if summary["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
