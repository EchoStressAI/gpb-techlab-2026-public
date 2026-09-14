from fastapi.testclient import TestClient

from gpb_submission.app import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["cases"]["CASE_1"]["analysis_horizon_sec"] == 60
    assert payload["cases"]["CASE_2"]["analysis_horizon_sec"] == 180


def test_readiness_is_fail_closed_without_runtime(monkeypatch):
    monkeypatch.delenv("GPB_CASE1_RUNTIME_URL", raising=False)
    monkeypatch.delenv("GPB_CASE2_RUNTIME_URL", raising=False)

    response = client.get("/readiness")
    assert response.status_code == 503
    payload = response.json()
    assert payload["status"] == "not_ready"
    assert payload["runtimes"]["CASE_1"]["status"] == "unavailable"
    assert payload["runtimes"]["CASE_2"]["status"] == "unavailable"


def test_analyze_rejects_unknown_case():
    response = client.post(
        "/api/v1/analyze",
        data={"case_id": "CASE_3"},
        files={"file": ("sample.wav", b"not-real-audio", "audio/wav")},
    )
    assert response.status_code == 400


def test_analyze_does_not_fake_score_without_runtime(monkeypatch):
    monkeypatch.delenv("GPB_CASE1_RUNTIME_URL", raising=False)

    response = client.post(
        "/api/v1/analyze",
        data={"case_id": "CASE_1"},
        files={"file": ("sample.wav", b"not-real-audio", "audio/wav")},
    )
    assert response.status_code == 503
    assert response.json()["detail"]["status"] == "MODEL_RUNTIME_UNAVAILABLE"
