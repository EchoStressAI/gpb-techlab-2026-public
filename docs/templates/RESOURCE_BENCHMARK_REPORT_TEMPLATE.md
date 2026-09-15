# Resource Benchmark Report Template

## 1. Release identity

```text
Benchmark ID:
Date/time:
Public repo commit/tag:
Runtime build:
Integration image digest:
Frontend image digest:
CASE 1 runtime image digest:
CASE 2 runtime image digest:
CASE 1 model_id:
CASE 2 model_id:
```

## 2. Environment

```text
OS:
CPU:
Host RAM:
GPU: NVIDIA A100
GPU count: 1
GPU memory:
NVIDIA driver:
CUDA:
Python:
ML framework:
Storage:
```

## 3. Network condition

```text
Mandatory external network during inference: yes/no
Weights downloaded at runtime: yes/no
External inference/ASR API required: yes/no
Blocking telemetry dependency: yes/no
```

Для on-prem acceptance ожидается `no` для обязательных внешних зависимостей inference path.

## 4. CASE 1 workload

```text
Analysis horizon: 60 sec
Number of cold runs:
Number of warm runs:
Representative input durations:
Evidence regimes tested:
Concurrency:
```

### Results

| Metric | Value |
|---|---:|
| Cold start latency, sec | |
| Warm median latency, sec | |
| Warm p90 latency, sec | |
| Warm max latency, sec | |
| Median peak VRAM, MB | |
| Max peak VRAM, MB | |
| Peak host RAM, MB | |
| Failure rate | |

Pass:

```text
[ ] <= 1 × A100
[ ] representative end-to-end response <= 60 sec
[ ] no OOM
[ ] fixed 60-sec information horizon preserved
```

## 5. CASE 2 workload

```text
Analysis horizon: 180 sec
Number of cold runs:
Number of warm runs:
Representative input durations:
Speech-coverage regimes:
History context enabled: yes/no
Concurrency:
```

### Results

| Metric | Value |
|---|---:|
| Cold start latency, sec | |
| Warm median latency, sec | |
| Warm p90 latency, sec | |
| Warm max latency, sec | |
| Median peak VRAM, MB | |
| Max peak VRAM, MB | |
| Peak host RAM, MB | |
| Failure rate | |

Pass:

```text
[ ] <= 1 × A100
[ ] representative end-to-end response <= 180 sec
[ ] no OOM
[ ] fixed 180-sec information horizon preserved
```

## 6. Failure-mode checks

```text
[ ] invalid audio
[ ] insufficient evidence
[ ] CASE 1 runtime unavailable
[ ] CASE 2 runtime unavailable
[ ] clean host/runtime restart
[ ] timeout behavior
[ ] contract mismatch
```

## 7. Notes

Отдельно указать:

- warm vs cold distinction;
- queueing, если она включена;
- любые exclusions;
- known bottlenecks;
- benchmark limitations.

## 8. Decision

```text
[ ] PASS for competition deployment profile
[ ] PASS WITH LIMITATIONS
[ ] FAIL / requires optimization
```

Rationale:
