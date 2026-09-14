"""Gateway to case-specific local model runtimes.

The public integration layer never fabricates model output. If a case runtime is
not configured or cannot be reached, callers receive an explicit unavailable
state. Runtime implementations may be supplied as separate local containers or
processes as long as they implement the documented HTTP contract.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import httpx

from .contracts import CASE_1, CASE_2, CASES

DEFAULT_TIMEOUT_SEC = 120.0


@dataclass(frozen=True, slots=True)
class RuntimeTarget:
    case_id: str
    url: str | None
    horizon_sec: int

    @property
    def configured(self) -> bool:
        return bool(self.url)


def runtime_targets() -> dict[str, RuntimeTarget]:
    return {
        CASE_1: RuntimeTarget(
            case_id=CASE_1,
            url=_clean_url(os.getenv("GPB_CASE1_RUNTIME_URL")),
            horizon_sec=CASES[CASE_1].horizon_sec,
        ),
        CASE_2: RuntimeTarget(
            case_id=CASE_2,
            url=_clean_url(os.getenv("GPB_CASE2_RUNTIME_URL")),
            horizon_sec=CASES[CASE_2].horizon_sec,
        ),
    }


class RuntimeUnavailable(RuntimeError):
    """Raised when the selected model runtime is not available."""


class RuntimeContractError(RuntimeError):
    """Raised when a runtime response violates the public contract."""


class RuntimeGateway:
    def __init__(self, target: RuntimeTarget, timeout_sec: float = DEFAULT_TIMEOUT_SEC):
        self.target = target
        self.timeout_sec = timeout_sec

    def health(self) -> dict[str, Any]:
        if not self.target.configured:
            return {
                "status": "unavailable",
                "case_id": self.target.case_id,
                "configured": False,
                "analysis_horizon_sec": self.target.horizon_sec,
            }

        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(f"{self.target.url}/health")
                response.raise_for_status()
                payload = response.json()
        except (httpx.HTTPError, ValueError) as error:
            return {
                "status": "unavailable",
                "case_id": self.target.case_id,
                "configured": True,
                "analysis_horizon_sec": self.target.horizon_sec,
                "detail": type(error).__name__,
            }

        if str(payload.get("case_id", "")).upper() != self.target.case_id:
            return {
                "status": "unavailable",
                "case_id": self.target.case_id,
                "configured": True,
                "analysis_horizon_sec": self.target.horizon_sec,
                "detail": "runtime_case_mismatch",
            }

        return {
            "status": "ok" if payload.get("status") == "ok" else "unavailable",
            "case_id": self.target.case_id,
            "configured": True,
            "analysis_horizon_sec": self.target.horizon_sec,
            "model_id": payload.get("model_id"),
        }

    def analyze(self, audio: bytes, filename: str) -> dict[str, Any]:
        if not self.target.configured:
            raise RuntimeUnavailable(f"{self.target.case_id} runtime is not configured")

        try:
            with httpx.Client(timeout=self.timeout_sec) as client:
                response = client.post(
                    f"{self.target.url}/v1/analyze",
                    data={"analysis_horizon_sec": str(self.target.horizon_sec)},
                    files={
                        "file": (
                            filename or "audio.bin",
                            audio,
                            "application/octet-stream",
                        )
                    },
                )
        except httpx.HTTPError as error:
            raise RuntimeUnavailable(type(error).__name__) from error

        if response.status_code >= 500:
            raise RuntimeUnavailable(f"runtime_http_{response.status_code}")
        if response.status_code >= 400:
            raise RuntimeContractError(f"runtime_http_{response.status_code}: {response.text[:300]}")

        try:
            payload = response.json()
        except ValueError as error:
            raise RuntimeContractError("runtime returned non-JSON response") from error

        _validate_result(payload, self.target)
        return payload


def _validate_result(payload: Any, target: RuntimeTarget) -> None:
    if not isinstance(payload, dict):
        raise RuntimeContractError("runtime result must be a JSON object")

    case_id = str(payload.get("case_id", "")).upper()
    if case_id != target.case_id:
        raise RuntimeContractError(
            f"runtime case mismatch: expected {target.case_id}, got {case_id or '<empty>'}"
        )

    try:
        horizon = int(payload.get("analysis_horizon_sec"))
    except (TypeError, ValueError) as error:
        raise RuntimeContractError("analysis_horizon_sec is missing or invalid") from error

    if horizon != target.horizon_sec:
        raise RuntimeContractError(
            f"runtime horizon mismatch: expected {target.horizon_sec}, got {horizon}"
        )

    if "status" not in payload:
        raise RuntimeContractError("runtime result must include status")
    if "model_id" not in payload:
        raise RuntimeContractError("runtime result must include model_id")


def _clean_url(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip().rstrip("/")
    return stripped or None


__all__ = [
    "RuntimeContractError",
    "RuntimeGateway",
    "RuntimeTarget",
    "RuntimeUnavailable",
    "runtime_targets",
]
