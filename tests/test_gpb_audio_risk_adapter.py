from __future__ import annotations

import httpx
from fastapi.testclient import TestClient

from gpb_submission.adapters import AdapterConfig, create_adapter_app


def _factory(handler):
    transport = httpx.MockTransport(handler)

    def make_client(**kwargs):
        return httpx.AsyncClient(transport=transport, **kwargs)

    return make_client


def test_case1_health_checks_real_primary_inventory() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/health":
            return httpx.Response(200, json={"status": "ok"})
        if request.url.path == "/api/v1/model-status":
            assert request.headers["authorization"] == "Bearer secret"
            return httpx.Response(
                200,
                json={
                    "cases": {
                        "CASE_1": {"case1_primary_inductive_cdf": True},
                        "CASE_2": {"case2_primary_acoustic11": True},
                    }
                },
            )
        raise AssertionError(request.url)

    app = create_adapter_app(
        AdapterConfig("CASE_1", "http://private", "secret"),
        client_factory=_factory(handler),
    )
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "case_id": "CASE_1",
        "model_id": "CASE1_INDUCTIVE_CDF_PRIMARY_V1",
        "analysis_horizon_sec": 60,
    }


def test_case1_health_is_unavailable_if_primary_artifacts_are_missing() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/health":
            return httpx.Response(200, json={"status": "ok"})
        if request.url.path == "/api/v1/model-status":
            return httpx.Response(
                200,
                json={"cases": {"CASE_1": {"case1_primary_inductive_cdf": False}}},
            )
        raise AssertionError(request.url)

    app = create_adapter_app(
        AdapterConfig("CASE_1", "http://private", "secret"),
        client_factory=_factory(handler),
    )
    payload = TestClient(app).get("/health").json()

    assert payload["status"] == "unavailable"
    assert payload["model_id"] == "CASE1_INDUCTIVE_CDF_PRIMARY_V1"


def test_case1_adapter_polls_job_and_returns_public_safe_result() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers.get("authorization") == "Bearer secret"
        if request.method == "POST" and request.url.path == "/api/v1/jobs":
            return httpx.Response(202, json={"job_id": "job-1", "status": "queued"})
        if request.method == "GET" and request.url.path == "/api/v1/jobs/job-1":
            return httpx.Response(200, json={"job_id": "job-1", "status": "done"})
        if request.method == "GET" and request.url.path == "/api/v1/jobs/job-1/case1":
            return httpx.Response(
                200,
                json={
                    "case_id": "CASE_1",
                    "primary": {
                        "status": "OK",
                        "model_id": "CASE1_INDUCTIVE_CDF_PRIMARY_V1",
                        "primary_score": 0.81,
                        "score_is_probability": False,
                        "decision_status": "REVIEW_REQUIRED",
                        "binary_prediction": None,
                        "safe_negative_flag": False,
                        "word_raw": 0.99,
                        "wordchar_raw": 0.98,
                        "evidence": {
                            "status": "SUFFICIENT",
                            "reason": "ok",
                            "client_word_count": 42,
                        },
                        "supporting": {
                            "client_turn_count": 5,
                            "client_speech_sec": 31.2,
                        },
                        "recommendations": ["Continue verification"],
                        "xai": {
                            "numeric_feature_contributions_available": False,
                            "allowed_facts": ["client_word_count"],
                        },
                    },
                },
            )
        raise AssertionError((request.method, request.url.path))

    app = create_adapter_app(
        AdapterConfig("CASE_1", "http://private", "secret", poll_interval_sec=0.0),
        client_factory=_factory(handler),
    )
    response = TestClient(app).post(
        "/v1/analyze",
        data={"analysis_horizon_sec": "60"},
        files={"file": ("synthetic.wav", b"not-real-audio", "audio/wav")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["case_id"] == "CASE_1"
    assert payload["primary_score"] == 0.81
    assert payload["quality"]["status"] == "OK"
    assert "word_raw" not in payload
    assert "wordchar_raw" not in payload


def test_case2_adapter_omits_exact_numeric_contributions() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "POST" and request.url.path == "/api/v1/jobs":
            return httpx.Response(202, json={"job_id": "job-2"})
        if request.method == "GET" and request.url.path == "/api/v1/jobs/job-2":
            return httpx.Response(200, json={"status": "done"})
        if request.method == "GET" and request.url.path == "/api/v1/jobs/job-2/risk":
            return httpx.Response(
                200,
                json={
                    "case_id": "CASE_2",
                    "primary": {
                        "status": "INSUFFICIENT_ACOUSTIC_EVIDENCE",
                        "model_id": "CASE2_OPEN_ACOUSTIC11_ORIENTED_V1",
                        "risk_score": 0.33,
                        "score_is_probability": False,
                        "oriented_decision": 0.22,
                        "reference_percentile": 64.0,
                        "risk_band": "example",
                        "interpretation": "relative signal",
                        "data_quality": {
                            "history_limited": True,
                            "history_eligible": False,
                            "primary_chunks_current": 0,
                            "primary_speech_sec_current": 0.0,
                        },
                        "xai": {
                            "top_positive": ["feature_a"],
                            "top_negative": ["feature_b"],
                            "contributions": [
                                {
                                    "feature": "feature_a",
                                    "oriented_coefficient": 123.0,
                                    "risk_contribution": 456.0,
                                }
                            ],
                        },
                    },
                },
            )
        raise AssertionError((request.method, request.url.path))

    app = create_adapter_app(
        AdapterConfig("CASE_2", "http://private", "secret", poll_interval_sec=0.0),
        client_factory=_factory(handler),
    )
    response = TestClient(app).post(
        "/v1/analyze",
        data={"analysis_horizon_sec": "180"},
        files={"file": ("synthetic.wav", b"not-real-audio", "audio/wav")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["case_id"] == "CASE_2"
    assert payload["quality"]["status"] == "INSUFFICIENT_EVIDENCE"
    assert payload["xai"] == {
        "type": "safe_factor_summary",
        "top_positive": ["feature_a"],
        "top_negative": ["feature_b"],
    }
    assert payload["responsible_use"]["automated_employment_decision"] is False
    assert "contributions" not in payload["xai"]


def test_adapter_rejects_wrong_horizon_before_upstream_call() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise AssertionError("upstream must not be called")

    app = create_adapter_app(
        AdapterConfig("CASE_1", "http://private", "secret"),
        client_factory=_factory(handler),
    )
    response = TestClient(app).post(
        "/v1/analyze",
        data={"analysis_horizon_sec": "180"},
        files={"file": ("synthetic.wav", b"not-real-audio", "audio/wav")},
    )

    assert response.status_code == 400
