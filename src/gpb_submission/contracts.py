"""Public case contracts for the GPB TechLab submission."""

from __future__ import annotations

from dataclasses import dataclass

CASE_1 = "CASE_1"
CASE_2 = "CASE_2"


@dataclass(frozen=True, slots=True)
class CaseSpec:
    case_id: str
    horizon_sec: int
    description: str


CASES: dict[str, CaseSpec] = {
    CASE_1: CaseSpec(
        case_id=CASE_1,
        horizon_sec=60,
        description="External influence / coercion risk signal",
    ),
    CASE_2: CaseSpec(
        case_id=CASE_2,
        horizon_sec=180,
        description="Employee state / burnout-risk signal",
    ),
}


def normalize_case_id(value: str) -> str:
    normalized = str(value).strip().upper()
    if normalized not in CASES:
        raise ValueError(f"unknown case_id={value!r}; expected one of {sorted(CASES)}")
    return normalized


__all__ = ["CASE_1", "CASE_2", "CASES", "CaseSpec", "normalize_case_id"]
