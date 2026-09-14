from gpb_submission.contracts import CASE_1, CASE_2, CASES, normalize_case_id


def test_case_horizons_are_frozen():
    assert CASES[CASE_1].horizon_sec == 60
    assert CASES[CASE_2].horizon_sec == 180


def test_case_id_normalization():
    assert normalize_case_id("case_1") == CASE_1
    assert normalize_case_id(" CASE_2 ") == CASE_2
