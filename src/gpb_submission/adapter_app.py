"""Uvicorn entry point for one public-safe GPB runtime adapter process."""

from __future__ import annotations

from gpb_submission.adapters import AdapterConfig, create_adapter_app

app = create_adapter_app(AdapterConfig.from_env())

__all__ = ["app"]
