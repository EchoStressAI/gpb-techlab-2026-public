#!/usr/bin/env python3
"""Score the GPB human explainability acceptance survey.

This script does not decide whether a study is representative. It reports the
number of valid assessments and the observed acceptance rate for the two
questions stated in the specification-oriented validation evidence:
1) is the explanation understandable;
2) can it support a decision / next action.

A row is counted as accepted only when both answers are positive.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path
from typing import Any

TRUE_VALUES = {"1", "true", "yes", "y", "да", "+"}
FALSE_VALUES = {"0", "false", "no", "n", "нет", "-"}
REQUIRED_COLUMNS = {
    "reviewer_id",
    "case_id",
    "sample_id",
    "explanation_understandable",
    "decision_support_usable",
}


def parse_bool(value: str, field: str, row_num: int) -> bool:
    token = value.strip().lower()
    if token in TRUE_VALUES:
        return True
    if token in FALSE_VALUES:
        return False
    raise ValueError(f"row {row_num}: {field} must be yes/no or 1/0, got {value!r}")


def score(path: Path, target: float) -> dict[str, Any]:
    rows: list[dict[str, str]] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise SystemExit(f"Missing required columns: {', '.join(sorted(missing))}")
        for row in reader:
            rows.append(row)

    if not rows:
        raise SystemExit("Survey file contains no assessments")

    accepted = 0
    understandable_yes = 0
    usable_yes = 0
    case_counts: Counter[str] = Counter()
    reviewer_ids: set[str] = set()
    sample_ids: set[str] = set()
    errors: list[str] = []

    for idx, row in enumerate(rows, start=2):
        try:
            understandable = parse_bool(row["explanation_understandable"], "explanation_understandable", idx)
            usable = parse_bool(row["decision_support_usable"], "decision_support_usable", idx)
        except ValueError as exc:
            errors.append(str(exc))
            continue

        case_id = row["case_id"].strip()
        reviewer = row["reviewer_id"].strip()
        sample = row["sample_id"].strip()
        if not case_id or not reviewer or not sample:
            errors.append(f"row {idx}: reviewer_id, case_id and sample_id must be non-empty")
            continue

        case_counts[case_id] += 1
        reviewer_ids.add(reviewer)
        sample_ids.add(sample)
        understandable_yes += int(understandable)
        usable_yes += int(usable)
        accepted += int(understandable and usable)

    valid = sum(case_counts.values())
    if valid == 0:
        raise SystemExit("No valid survey assessments")

    acceptance_rate = accepted / valid
    understandable_rate = understandable_yes / valid
    usable_rate = usable_yes / valid

    return {
        "status": "PASS" if acceptance_rate >= target else "BELOW_TARGET",
        "target_acceptance_rate": target,
        "valid_assessments": valid,
        "invalid_rows": len(errors),
        "unique_reviewers": len(reviewer_ids),
        "unique_samples": len(sample_ids),
        "case_counts": dict(sorted(case_counts.items())),
        "explanation_understandable_rate": round(understandable_rate, 6),
        "decision_support_usable_rate": round(usable_rate, 6),
        "joint_acceptance_rate": round(acceptance_rate, 6),
        "accepted_assessments": accepted,
        "errors": errors,
        "interpretation_note": (
            "PASS means only that the observed joint positive share in this supplied survey file is at or above the target. "
            "It does not by itself establish representativeness, external validity, or an HR-policy decision."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Score human explainability acceptance responses")
    parser.add_argument("responses", type=Path)
    parser.add_argument("--target", type=float, default=0.80)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    if not 0 <= args.target <= 1:
        raise SystemExit("--target must be between 0 and 1")

    result = score(args.responses, args.target)
    text = json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True)
    print(text)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
