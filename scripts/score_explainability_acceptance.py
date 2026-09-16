#!/usr/bin/env python3
"""Score the GPB HR explainability acceptance survey.

Frozen protocol semantics:
- Q1 result clarity: 1..5
- Q2 feature/explanation clarity: 1..5
- Q3 actionability: 1..5
- Q4 safety-of-interpretation clarity: 1..5
- one rating is accepted iff Q2 >= 4 AND Q3 >= 4
- main criterion passes iff observed acceptance rate >= target (default 0.80)

The script reports sample composition and a Wilson 95% interval, but it does not
claim that the respondent sample is representative.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import statistics
from collections import Counter
from pathlib import Path
from typing import Any

REQUIRED_COLUMNS = {
    "respondent_id",
    "explanation_case_id",
    "case_id",
    "q1_result_clarity",
    "q2_feature_clarity",
    "q3_actionability",
    "q4_safety_clarity",
}
QUESTIONS = (
    "q1_result_clarity",
    "q2_feature_clarity",
    "q3_actionability",
    "q4_safety_clarity",
)


def parse_rating(value: str, field: str, row_num: int) -> int:
    try:
        rating = int(value.strip())
    except ValueError as exc:
        raise ValueError(f"row {row_num}: {field} must be an integer 1..5") from exc
    if rating < 1 or rating > 5:
        raise ValueError(f"row {row_num}: {field} must be in 1..5, got {rating}")
    return rating


def wilson_interval(successes: int, total: int, z: float = 1.96) -> tuple[float, float]:
    if total <= 0:
        return (0.0, 0.0)
    p = successes / total
    denom = 1 + (z * z) / total
    center = (p + (z * z) / (2 * total)) / denom
    margin = (
        z
        * math.sqrt((p * (1 - p) / total) + ((z * z) / (4 * total * total)))
        / denom
    )
    return (max(0.0, center - margin), min(1.0, center + margin))


def score(path: Path, target: float) -> dict[str, Any]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise SystemExit(f"Missing required columns: {', '.join(sorted(missing))}")
        rows = list(reader)

    if not rows:
        raise SystemExit("Survey file contains no assessments")

    respondent_counts: Counter[str] = Counter()
    case_counts: Counter[str] = Counter()
    explanation_ids: set[str] = set()
    ratings: dict[str, list[int]] = {question: [] for question in QUESTIONS}
    accepted = 0
    errors: list[str] = []

    for row_num, row in enumerate(rows, start=2):
        respondent_id = row["respondent_id"].strip()
        explanation_case_id = row["explanation_case_id"].strip()
        case_id = row["case_id"].strip()
        if not respondent_id or not explanation_case_id or not case_id:
            errors.append(
                f"row {row_num}: respondent_id, explanation_case_id and case_id must be non-empty"
            )
            continue

        try:
            parsed = {
                question: parse_rating(row[question], question, row_num)
                for question in QUESTIONS
            }
        except ValueError as exc:
            errors.append(str(exc))
            continue

        respondent_counts[respondent_id] += 1
        case_counts[case_id] += 1
        explanation_ids.add(explanation_case_id)
        for question, value in parsed.items():
            ratings[question].append(value)
        accepted += int(
            parsed["q2_feature_clarity"] >= 4 and parsed["q3_actionability"] >= 4
        )

    valid = sum(respondent_counts.values())
    if valid == 0:
        raise SystemExit("No valid survey assessments")

    main_rate = accepted / valid
    ci_low, ci_high = wilson_interval(accepted, valid)

    per_question: dict[str, Any] = {}
    for question in QUESTIONS:
        values = ratings[question]
        per_question[question] = {
            "rate_ge_4": round(sum(value >= 4 for value in values) / valid, 6),
            "mean": round(statistics.mean(values), 6),
            "median": statistics.median(values),
        }

    return {
        "status": "PASS" if main_rate >= target else "BELOW_TARGET",
        "target_acceptance_rate": target,
        "protocol_rule": "Q2>=4 AND Q3>=4",
        "valid_respondent_case_ratings": valid,
        "invalid_rows": len(errors),
        "unique_hr_respondents": len(respondent_counts),
        "unique_explanation_cases": len(explanation_ids),
        "ratings_per_respondent": dict(sorted(respondent_counts.items())),
        "case_counts": dict(sorted(case_counts.items())),
        "question_metrics": per_question,
        "accepted_ratings": accepted,
        "main_acceptance_rate": round(main_rate, 6),
        "main_acceptance_wilson_95_ci": [round(ci_low, 6), round(ci_high, 6)],
        "errors": errors,
        "interpretation_note": (
            "PASS means only that the observed Q2>=4 AND Q3>=4 share in this supplied survey dataset is at or above the target. "
            "It does not by itself establish representativeness, external validity, or permission for autonomous HR decisions."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Score GPB HR explainability acceptance responses")
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
