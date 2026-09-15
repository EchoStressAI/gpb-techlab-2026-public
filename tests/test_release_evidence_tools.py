import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run_script(script: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(ROOT / "scripts" / script), *args],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


def customer_evidence() -> dict:
    return {
        "evidence_schema_version": "1.2",
        "audience": "customer",
        "generated_at_utc": "2026-09-15T00:00:00+00:00",
        "product": "EchoStressAI GPB TechLab 2026",
        "acceptance": {"mode": "functional", "status": "PASS"},
        "release_gate": {"mode": "functional", "passed": True},
        "release_identity": {
            "release_id": "candidate-1",
            "image_tag": "echostress-gpb:candidate-1",
            "image_digest": None,
        },
        "runtime_packages": {},
        "models": {
            "case1_primary": {"model_id": "CASE1_INDUCTIVE_CDF_PRIMARY_V1"},
            "case2_primary": {"model_id": "CASE2_OPEN_ACOUSTIC11_ORIENTED_V1"},
        },
        "docker": {
            "tar": {"present": True, "filename": "candidate.tar", "sha256": "a" * 64},
            "audit": {
                "present": True,
                "audit_passed": True,
                "source_hardening_passed": False,
                "violation_count": 0,
            },
        },
    }


def test_customer_release_validator_functional_and_final(tmp_path: Path) -> None:
    evidence = customer_evidence()
    source = tmp_path / "evidence.json"
    source.write_text(json.dumps(evidence), encoding="utf-8")

    functional = run_script(
        "validate_customer_release_evidence.py",
        str(source),
        "--profile",
        "functional",
    )
    assert functional.returncode == 0, functional.stderr
    assert json.loads(functional.stdout)["status"] == "PASS"

    final_before = run_script(
        "validate_customer_release_evidence.py",
        str(source),
        "--profile",
        "final",
    )
    assert final_before.returncode == 1
    failed = json.loads(final_before.stdout)
    assert failed["status"] == "FAIL"
    assert any("image_digest" in item for item in failed["failures"])

    evidence["acceptance"]["mode"] = "protected"
    evidence["release_gate"]["mode"] = "protected"
    evidence["release_identity"]["image_digest"] = "sha256:" + "b" * 64
    evidence["docker"]["audit"]["source_hardening_passed"] = True
    source.write_text(json.dumps(evidence), encoding="utf-8")

    final_after = run_script(
        "validate_customer_release_evidence.py",
        str(source),
        "--profile",
        "final",
    )
    assert final_after.returncode == 0, final_after.stderr
    assert json.loads(final_after.stdout)["status"] == "PASS"


def test_explainability_acceptance_scorer(tmp_path: Path) -> None:
    responses = tmp_path / "responses.csv"
    responses.write_text(
        "reviewer_id,case_id,sample_id,explanation_understandable,decision_support_usable,comments\n"
        "r1,CASE_1,s1,yes,yes,\n"
        "r1,CASE_2,s2,yes,yes,\n"
        "r2,CASE_1,s3,yes,yes,\n"
        "r2,CASE_2,s4,yes,yes,\n"
        "r3,CASE_2,s5,yes,no,\n",
        encoding="utf-8",
    )

    result = run_script(
        "score_explainability_acceptance.py",
        str(responses),
        "--target",
        "0.80",
    )
    assert result.returncode == 0, result.stderr
    payload = json.loads(result.stdout)
    assert payload["valid_assessments"] == 5
    assert payload["accepted_assessments"] == 4
    assert payload["joint_acceptance_rate"] == 0.8
    assert payload["status"] == "PASS"
