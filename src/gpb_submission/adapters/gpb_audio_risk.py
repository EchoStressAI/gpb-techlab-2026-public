"""Adapter from the private/local ``gpb-audio-risk`` API to the public runtime contract.

The adapter contains no model implementation. It submits an audio file to the
existing asynchronous multi-case API, polls the job, and exposes a small
public-safe result. Exact model internals, legacy blocks and detailed additive
coefficients are intentionally not proxied.
"""

from __future__ import annotations

import asyncio
import os
import time
from dataclasses import dataclass
from typing import Any, Callable

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from gpb_submission.contracts import CASE_1, CASE_2, CASES, normalize_case_id

MAX_UPLOAD_BYTES = 200 * 1024 * 1024
DEFAULT_REQUEST_TIMEOUT_SEC = 30.0
DEFAULT_JOB_TIMEOUT_SEC = 900.0
DEFAULT_POLL_INTERVAL_SEC = 0.75

MODEL_IDS = {
    CASE_1: "CASE1_INDUCTIVE_CDF_PRIMARY_V1",
    CASE_2: "CASE2_OPEN_ACOUSTIC11_ORIENTED_V1",
}
PRIMARY_INVENTORY_KEYS = {
    CASE_1: "case1_primary_inductive_cdf",
    CASE_2: "case2_primary_acoustic11",
}
RESULT_PATHS = {
    CASE_1: "/api/v1/jobs/{job_id}/case1",
    CASE_2: "/api/v1/jobs/{job_id}/risk",
}


@dataclass(frozen=True, slots=True)
class AdapterConfig:
    """Configuration of one CASE-specific adapter process."""

    case_id: str
    upstream_url: str
    upstream_token: str
    request_timeout_sec: float = DEFAULT_REQUEST_TIMEOUT_SEC
    job_timeout_sec: float = DEFAULT_JOB_TIMEOUT_SEC
    poll_interval_sec: float = DEFAULT_POLL_INTERVAL_SEC

    @property
    def horizon_sec(self) -> int:
        return CASES[self.case_id].horizon_sec

    @property
    def model_id(self) -> str:
        return MODEL_IDS[self.case_id]

    @classmethod
    def from_env(cls) -> "AdapterConfig":
        raw_case = os.environ.get("GPB_ADAPTER_CASE_ID", "").strip()
        if not raw_case:
            raise RuntimeError("GPB_ADAPTER_CASE_ID is required")
        case_id = normalize_case_id(raw_case)

        upstream_url = os.environ.get("GPB_INTERNAL_API_URL", "").strip().rstrip("/")
        if not upstream_url:
            raise RuntimeError("GPB_INTERNAL_API_URL is required")

        upstream_token = os.environ.get("GPB_INTERNAL_API_TOKEN", "").strip()
        if not upstream_token:
            raise RuntimeError("GPB_INTERNAL_API_TOKEN is required")

        return cls(
            case_id=case_id,
            upstream_url=upstream_url,
            upstream_token=upstream_token,
            request_timeout_sec=float(
                os.environ.get("GPB_ADAPTER_REQUEST_TIMEOUT_SEC", DEFAULT_REQUEST_TIMEOUT_SEC)
            ),
            job_timeout_sec=float(
                os.environ.get("GPB_ADAPTER_JOB_TIMEOUT_SEC", DEFAULT_JOB_TIMEOUT_SEC)
            ),
            poll_interval_sec=float(
                os.environ.get("GPB_ADAPTER_POLL_INTERVAL_SEC", DEFAULT_POLL_INTERVAL_SEC)
            ),
        )


class AdapterUpstreamError(RuntimeError):
    """Upstream service is unavailable or cannot process the request."""


class AdapterContractError(RuntimeError):
    """Upstream response cannot be safely translated to the public contract."""


def _auth_headers(config: AdapterConfig) -> dict[str, str]:
    return {"Authorization": f"Bearer {config.upstream_token}"}


def _json(response: httpx.Response, label: str) -> dict[str, Any]:
    try:
        payload = response.json()
    except ValueError as error:
        raise AdapterContractError(f"{label} returned non-JSON") from error
    if not isinstance(payload, dict):
        raise AdapterContractError(f"{label} returned non-object JSON")
    return payload


def _safe_http_detail(status_code: int) -> str:
    """Do not proxy private traceback/error bodies to the public adapter caller."""

    return f"upstream_http_{status_code}"


def _inventory_ready(payload: dict[str, Any], config: AdapterConfig) -> bool:
    cases = payload.get("cases")
    if not isinstance(cases, dict):
        return False
    case_inventory = cases.get(config.case_id)
    if not isinstance(case_inventory, dict):
        return False
    return bool(case_inventory.get(PRIMARY_INVENTORY_KEYS[config.case_id]))


def _case1_public_result(payload: dict[str, Any], config: AdapterConfig) -> dict[str, Any]:
    primary = payload.get("primary")
    if not isinstance(primary, dict):
        raise AdapterContractError("CASE_1 result has no primary object")

    if str(primary.get("status", "")).upper() == "PRIMARY_MODEL_UNAVAILABLE":
        raise AdapterUpstreamError("CASE_1 primary model is unavailable")

    evidence = primary.get("evidence") if isinstance(primary.get("evidence"), dict) else {}
    supporting = (
        primary.get("supporting") if isinstance(primary.get("supporting"), dict) else {}
    )
    upstream_xai = primary.get("xai") if isinstance(primary.get("xai"), dict) else {}

    evidence_status = str(evidence.get("status", "UNKNOWN")).upper()
    quality_status = "OK" if evidence_status == "SUFFICIENT" else "INSUFFICIENT_EVIDENCE"

    return {
        "status": "ok",
        "case_id": CASE_1,
        "model_id": str(primary.get("model_id") or config.model_id),
        "analysis_horizon_sec": config.horizon_sec,
        "primary_score": primary.get("primary_score"),
        "score_is_probability": bool(primary.get("score_is_probability", False)),
        "decision_status": primary.get("decision_status"),
        "binary_prediction": primary.get("binary_prediction"),
        "safe_negative_flag": primary.get("safe_negative_flag"),
        "quality": {
            "status": quality_status,
            "evidence_status": evidence.get("status"),
            "evidence_reason": evidence.get("reason"),
            "client_word_count": evidence.get("client_word_count"),
            "client_turn_count": supporting.get("client_turn_count"),
            "client_speech_sec": supporting.get("client_speech_sec"),
        },
        "recommendations": list(primary.get("recommendations") or []),
        "xai": {
            "numeric_feature_contributions_available": bool(
                upstream_xai.get("numeric_feature_contributions_available", False)
            ),
            "allowed_facts": list(upstream_xai.get("allowed_facts") or []),
        },
        "provenance": {
            "adapter": "gpb-audio-risk-v1",
            "target_role": "CLIENT",
            "window_sec": config.horizon_sec,
        },
    }


def _case2_public_result(payload: dict[str, Any], config: AdapterConfig) -> dict[str, Any]:
    primary = payload.get("primary")
    if not isinstance(primary, dict):
        raise AdapterContractError("CASE_2 result has no primary object")

    if str(primary.get("status", "")).upper() == "PRIMARY_MODEL_UNAVAILABLE":
        raise AdapterUpstreamError("CASE_2 primary model is unavailable")

    quality = (
        primary.get("data_quality")
        if isinstance(primary.get("data_quality"), dict)
        else {}
    )
    upstream_xai = primary.get("xai") if isinstance(primary.get("xai"), dict) else {}

    primary_status = str(primary.get("status", "UNKNOWN")).upper()
    quality_status = (
        "OK"
        if primary_status == "OK"
        else "INSUFFICIENT_EVIDENCE"
        if primary_status == "INSUFFICIENT_ACOUSTIC_EVIDENCE"
        else "LIMITED_EVIDENCE"
    )

    top_positive = [str(item) for item in (upstream_xai.get("top_positive") or [])]
    top_negative = [str(item) for item in (upstream_xai.get("top_negative") or [])]

    return {
        "status": "ok",
        "case_id": CASE_2,
        "model_id": str(primary.get("model_id") or config.model_id),
        "analysis_horizon_sec": config.horizon_sec,
        "risk_score": primary.get("risk_score"),
        "score_is_probability": bool(primary.get("score_is_probability", False)),
        "oriented_decision": primary.get("oriented_decision"),
        "reference_percentile": primary.get("reference_percentile"),
        "risk_band": primary.get("risk_band"),
        "interpretation": primary.get("interpretation"),
        "quality": {
            "status": quality_status,
            "runtime_primary_status": primary.get("status"),
            "history_limited": quality.get("history_limited"),
            "history_eligible": quality.get("history_eligible"),
            "primary_chunks_current": quality.get("primary_chunks_current"),
            "primary_speech_sec_current": quality.get("primary_speech_sec_current"),
        },
        "xai": {
            "type": "safe_factor_summary",
            "top_positive": top_positive,
            "top_negative": top_negative,
        },
        "responsible_use": {
            "automated_employment_decision": False,
            "note": (
                "Research/operational speech-state signal; not a diagnosis or an "
                "automatic employment, disciplinary, medical or insurance decision."
            ),
        },
        "provenance": {
            "adapter": "gpb-audio-risk-v1",
            "target_role": "SUPPORT_OPERATOR",
            "window_sec": config.horizon_sec,
        },
    }


def _public_result(payload: dict[str, Any], config: AdapterConfig) -> dict[str, Any]:
    if config.case_id == CASE_1:
        return _case1_public_result(payload, config)
    return _case2_public_result(payload, config)


AsyncClientFactory = Callable[..., httpx.AsyncClient]


def create_adapter_app(
    config: AdapterConfig,
    *,
    client_factory: AsyncClientFactory = httpx.AsyncClient,
) -> FastAPI:
    """Build one adapter process for exactly one case."""

    app = FastAPI(
        title=f"EchoStressAI GPB public adapter · {config.case_id}",
        version="1.0",
    )
    app.state.config = config

    @app.get("/health")
    async def health() -> dict[str, Any]:
        try:
            async with client_factory(timeout=config.request_timeout_sec) as client:
                upstream_health = await client.get(f"{config.upstream_url}/health")
                if upstream_health.status_code >= 400:
                    return {
                        "status": "unavailable",
                        "case_id": config.case_id,
                        "model_id": config.model_id,
                        "analysis_horizon_sec": config.horizon_sec,
                        "detail": _safe_http_detail(upstream_health.status_code),
                    }

                model_status = await client.get(
                    f"{config.upstream_url}/api/v1/model-status",
                    headers=_auth_headers(config),
                )
                if model_status.status_code >= 400:
                    return {
                        "status": "unavailable",
                        "case_id": config.case_id,
                        "model_id": config.model_id,
                        "analysis_horizon_sec": config.horizon_sec,
                        "detail": _safe_http_detail(model_status.status_code),
                    }
                inventory = _json(model_status, "model-status")
                ready = _inventory_ready(inventory, config)
        except (httpx.HTTPError, AdapterContractError) as error:
            return {
                "status": "unavailable",
                "case_id": config.case_id,
                "model_id": config.model_id,
                "analysis_horizon_sec": config.horizon_sec,
                "detail": type(error).__name__,
            }

        return {
            "status": "ok" if ready else "unavailable",
            "case_id": config.case_id,
            "model_id": config.model_id,
            "analysis_horizon_sec": config.horizon_sec,
        }

    @app.post("/v1/analyze")
    async def analyze(
        file: UploadFile = File(...),
        analysis_horizon_sec: int = Form(...),
    ) -> dict[str, Any]:
        if int(analysis_horizon_sec) != config.horizon_sec:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"analysis_horizon_sec mismatch: expected {config.horizon_sec}, "
                    f"got {analysis_horizon_sec}"
                ),
            )

        audio = await file.read(MAX_UPLOAD_BYTES + 1)
        if not audio:
            raise HTTPException(status_code=400, detail="empty upload")
        if len(audio) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="upload exceeds 200 MiB")

        headers = _auth_headers(config)
        try:
            async with client_factory(timeout=config.request_timeout_sec) as client:
                submitted = await client.post(
                    f"{config.upstream_url}/api/v1/jobs",
                    headers=headers,
                    data={"case_id": config.case_id},
                    files={
                        "file": (
                            file.filename or "audio.bin",
                            audio,
                            file.content_type or "application/octet-stream",
                        )
                    },
                )
                if submitted.status_code >= 500:
                    raise AdapterUpstreamError(_safe_http_detail(submitted.status_code))
                if submitted.status_code >= 400:
                    raise AdapterContractError(_safe_http_detail(submitted.status_code))

                submission = _json(submitted, "submit")
                job_id = str(submission.get("job_id") or "").strip()
                if not job_id:
                    raise AdapterContractError("submit response has no job_id")

                deadline = time.monotonic() + config.job_timeout_sec
                while True:
                    if time.monotonic() >= deadline:
                        raise AdapterUpstreamError("upstream_job_timeout")

                    status_response = await client.get(
                        f"{config.upstream_url}/api/v1/jobs/{job_id}",
                        headers=headers,
                    )
                    if status_response.status_code >= 500:
                        raise AdapterUpstreamError(
                            _safe_http_detail(status_response.status_code)
                        )
                    if status_response.status_code >= 400:
                        raise AdapterContractError(
                            _safe_http_detail(status_response.status_code)
                        )

                    job = _json(status_response, "job-status")
                    state = str(job.get("status") or "").strip().lower()
                    if state == "done":
                        break
                    if state == "failed":
                        raise AdapterUpstreamError("upstream_processing_failed")
                    if state not in {"queued", "running"}:
                        raise AdapterContractError(
                            f"unexpected upstream job status: {state or '<empty>'}"
                        )
                    await asyncio.sleep(config.poll_interval_sec)

                result_path = RESULT_PATHS[config.case_id].format(job_id=job_id)
                result_response = await client.get(
                    f"{config.upstream_url}{result_path}",
                    headers=headers,
                )
                if result_response.status_code >= 500:
                    raise AdapterUpstreamError(
                        _safe_http_detail(result_response.status_code)
                    )
                if result_response.status_code >= 400:
                    raise AdapterContractError(
                        _safe_http_detail(result_response.status_code)
                    )
                upstream_result = _json(result_response, "job-result")
                return _public_result(upstream_result, config)

        except AdapterUpstreamError as error:
            raise HTTPException(
                status_code=503,
                detail={
                    "status": "MODEL_RUNTIME_UNAVAILABLE",
                    "case_id": config.case_id,
                    "detail": str(error),
                },
            ) from error
        except (AdapterContractError, httpx.HTTPError) as error:
            raise HTTPException(
                status_code=502,
                detail={
                    "status": "UPSTREAM_CONTRACT_ERROR",
                    "case_id": config.case_id,
                    "detail": type(error).__name__,
                },
            ) from error

    return app


__all__ = [
    "AdapterConfig",
    "AdapterContractError",
    "AdapterUpstreamError",
    "create_adapter_app",
]
