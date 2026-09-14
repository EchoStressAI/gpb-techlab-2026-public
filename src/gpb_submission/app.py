"""Public FastAPI integration layer for GPB TechLab 2026."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from .contracts import CASES, normalize_case_id
from .runtime import (
    RuntimeContractError,
    RuntimeGateway,
    RuntimeUnavailable,
    runtime_targets,
)

MAX_UPLOAD_BYTES = 200 * 1024 * 1024

app = FastAPI(
    title="EchoStressAI · GPB TechLab 2026",
    description="Public integration API for the two GPB TechLab cases.",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "echostress-gpb-submission",
        "cases": {
            case_id: {
                "analysis_horizon_sec": spec.horizon_sec,
                "description": spec.description,
            }
            for case_id, spec in CASES.items()
        },
    }


@app.get("/readiness")
@app.get("/api/v1/readiness")
def readiness() -> JSONResponse:
    runtimes = {
        case_id: RuntimeGateway(target).health()
        for case_id, target in runtime_targets().items()
    }
    ready = all(item.get("status") == "ok" for item in runtimes.values())
    return JSONResponse(
        status_code=200 if ready else 503,
        content={
            "status": "ready" if ready else "not_ready",
            "runtimes": runtimes,
        },
    )


@app.post("/api/v1/analyze")
async def analyze(
    file: UploadFile = File(..., description="Audio recording"),
    case_id: str = Form(..., description="CASE_1 or CASE_2"),
) -> dict[str, Any]:
    try:
        normalized_case = normalize_case_id(case_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    audio = await file.read(MAX_UPLOAD_BYTES + 1)
    if not audio:
        raise HTTPException(status_code=400, detail="empty upload")
    if len(audio) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="audio file is too large")

    target = runtime_targets()[normalized_case]
    gateway = RuntimeGateway(target)

    try:
        result = gateway.analyze(audio, file.filename or "audio.bin")
    except RuntimeUnavailable as error:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "MODEL_RUNTIME_UNAVAILABLE",
                "case_id": normalized_case,
                "detail": str(error),
            },
        ) from error
    except RuntimeContractError as error:
        raise HTTPException(
            status_code=502,
            detail={
                "status": "MODEL_RUNTIME_CONTRACT_ERROR",
                "case_id": normalized_case,
                "detail": str(error),
            },
        ) from error

    return {
        "case_id": normalized_case,
        "source_filename": file.filename,
        "analysis_horizon_sec": CASES[normalized_case].horizon_sec,
        "result": result,
    }


__all__ = ["app"]
