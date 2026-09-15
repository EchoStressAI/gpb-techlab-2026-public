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


def runtime_evidence() -> dict:
    return {
        "schema_version": "1.0",
        "release_id": "candidate-1",
        "hardware": {"gpu_names": ["NVIDIA A100-SXM4-80GB"], "a100_detected": True},
        "cases": [
            {
                "case_id": "CASE_1",
                "model_id": "CASE1_INDUCTIVE_CDF_PRIMARY_V1",
                "status": "PASS",
                "wall_clock_upload_to_done_sec": 42.0,
                "gpu": {"sample_count": 10, "gpus": []},
            },
            {
                "case_id": "CASE_2",
                "model_id": "CASE2_OPEN_ACOUSTIC11_ORIENTED_V1",
                "status": "PASS",
                "wall_clock_upload_to_done_sec": 118.0,
                "gpu": {"sample_count": 20, "gpus": []},
            },
        ],
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
        "respondent_id,explanation_case_id,case_id,q1_result_clarity,q2_feature_clarity,q3_actionability,q4_safety_clarity,comments\n"
        "hr1,e1,CASE_2,5,5,5,5,\n"
        "hr1,e2,CASE_2,4,4,4,5,\n"
        "hr2,e3,CASE_2,4,5,4,4,\n"
        "hr2,e4,CASE_2,5,4,5,4,\n"
        "hr3,e5,CASE_2,4,4,3,5,\n",
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
    assert payload["valid_respondent_case_ratings"] == 5
    assert payload["accepted_ratings"] == 4
    assert payload["main_acceptance_rate"] == 0.8
    assert payload["protocol_rule"] == "Q2>=4 AND Q3>=4"
    assert payload["unique_hr_respondents"] == 3
    assert payload["status"] == "PASS"


def test_public_release_manifest_assembler_respects_required_gates(tmp_path: Path) -> None:
    customer = customer_evidence()
    runtime = runtime_evidence()
    human = {
        "status": "PASS",
        "protocol_rule": "Q2>=4 AND Q3>=4",
        "main_acceptance_rate": 0.8,
        "main_acceptance_wilson_95_ci": [0.49, 0.94],
        "valid_respondent_case_ratings": 10,
        "unique_hr_respondents": 5,
    }

    customer_path = tmp_path / "customer.json"
    runtime_path = tmp_path / "runtime.json"
    human_path = tmp_path / "human.json"
    output_path = tmp_path / "final.json"
    customer_path.write_text(json.dumps(customer), encoding="utf-8")
    runtime_path.write_text(json.dumps(runtime), encoding="utf-8")
    human_path.write_text(json.dumps(human), encoding="utf-8")

    complete_for_selected_gates = run_script(
        "assemble_public_release_manifest.py",
        "--customer-evidence",
        str(customer_path),
        "--runtime-evidence",
        str(runtime_path),
        "--explainability-summary",
        str(human_path),
        "--require-a100",
        "--require-human-xai",
        "--public-commit",
        "abc123",
        "--output",
        str(output_path),
    )
    assert complete_for_selected_gates.returncode == 0, complete_for_selected_gates.stderr
    payload = json.loads(complete_for_selected_gates.stdout)
    assert payload["status"] == "PASS"
    assert payload["hardware"]["a100_detected"] is True
    assert payload["human_explainability"]["criterion_80_percent_pass"] is True
    assert payload["human_explainability"]["main_acceptance_rate"] == 0.8

    runtime["hardware"]["a100_detected"] = False
    runtime_path.write_text(json.dumps(runtime), encoding="utf-8")
    missing_a100 = run_script(
        "assemble_public_release_manifest.py",
        "--customer-evidence",
        str(customer_path),
        "--runtime-evidence",
        str(runtime_path),
        "--require-a100",
        "--public-commit",
        "abc123",
        "--output",
        str(output_path),
    )
    assert missing_a100.returncode == 1
    failed = json.loads(missing_a100.stdout)
    assert failed["status"] == "INCOMPLETE"
    assert any("A100" in item for item in failed["failures"])


def test_public_release_manifest_strict_protected_gate(tmp_path: Path) -> None:
    customer = customer_evidence()
    runtime = runtime_evidence()
    customer_path = tmp_path / "customer.json"
    runtime_path = tmp_path / "runtime.json"
    output_path = tmp_path / "final.json"
    customer_path.write_text(json.dumps(customer), encoding="utf-8")
    runtime_path.write_text(json.dumps(runtime), encoding="utf-8")

    strict_before = run_script(
        "assemble_public_release_manifest.py",
        "--customer-evidence",
        str(customer_path),
        "--runtime-evidence",
        str(runtime_path),
        "--require-protected",
        "--require-image-digest",
        "--public-commit",
        "abc123",
        "--output",
        str(output_path),
    )
    assert strict_before.returncode == 1

    customer["acceptance"]["mode"] = "protected"
    customer["release_gate"]["mode"] = "protected"
    customer["release_identity"]["image_digest"] = "sha256:" + "c" * 64
    customer["docker"]["audit"]["source_hardening_passed"] = True
    customer_path.write_text(json.dumps(customer), encoding="utf-8")

    strict_after = run_script(
        "assemble_public_release_manifest.py",
        "--customer-evidence",
        str(customer_path),
        "--runtime-evidence",
        str(runtime_path),
        "--require-protected",
        "--require-image-digest",
        "--public-commit",
        "abc123",
        "--output",
        str(output_path),
    )
    assert strict_after.returncode == 0, strict_after.stderr
    assert json.loads(strict_after.stdout)["status"] == "PASS"
