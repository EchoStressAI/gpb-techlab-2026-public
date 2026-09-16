# Resource & Latency Benchmark Protocol

Техническое ТЗ задаёт ограничение **1 × NVIDIA A100** и допускает время ответа до 60/180 секунд в зависимости от задачи. Этот документ определяет воспроизводимый benchmark для конкретного connected-runtime release.

## 1. Что проверяется

Benchmark отвечает на четыре разных вопроса:

1. помещается ли full runtime в согласованный GPU ceiling;
2. укладывается ли end-to-end обработка в допустимое время;
3. воспроизводим ли результат после clean start;
4. не скрывает ли average latency редкие критические выбросы.

## 2. Не путать horizon и latency

Для CASE 1:

```text
analysis horizon = первые 60 секунд разговора
processing latency = техническое время расчёта после получения файла/окна
```

Для CASE 2:

```text
analysis horizon = первые 180 секунд
processing latency = техническое время расчёта
```

Одинаковые числа в ТЗ не делают эти понятия эквивалентными.

## 3. Зафиксировать environment

До запуска записать:

```text
public_repo_commit
runtime_build_id
CASE_1 model_id
CASE_2 model_id
container digests
OS
GPU model
GPU memory
NVIDIA driver
CUDA version
Python version
PyTorch/runtime version
CPU
RAM
storage type
```

## 4. GPU profile

Acceptance environment:

```text
GPU count: 1
GPU class: NVIDIA A100
```

Не использовать несколько GPU для получения конкурсного результата, если это не согласовано отдельно.

## 5. Набор workload

Для каждого CASE использовать несколько длительностей и quality regimes.

### CASE 1

Минимально:

- файл с достаточной клиентской речью в первых 60 сек;
- файл с малым client speech coverage;
- более длинный файл, где runtime всё равно обязан соблюдать 60-sec horizon.

### CASE 2

Минимально:

- запись с достаточной речью сотрудника;
- запись с малым speech coverage;
- длинная запись >180 sec;
- если используется history context — один history-eligible пример.

Тестовые файлы не обязаны храниться в public Git.

## 6. Cold / warm runs

Для каждой конфигурации разделять:

### Cold start

- контейнер/model process запущен заново;
- weights ещё не прогреты;
- измеряется model load + first inference.

### Warm inference

- runtime уже ready;
- измеряется обычная эксплуатационная обработка.

Оба результата важны, но SLA/response-time claim должен явно указывать, какой режим используется.

## 7. Количество повторов

Рекомендуется минимум:

```text
1 cold run per case
>= 10 warm runs per representative workload
```

Если выборка меньше, это указывается как ограничение.

## 8. Измеряемые метрики

Для каждого run:

```text
case_id
input_duration_sec
analysis_horizon_sec
speech_coverage_sec (если доступно)
wall_clock_sec
queue_wait_sec (если есть)
model_compute_sec (если доступно)
peak_gpu_memory_mb
peak_host_ram_mb
cpu_utilization summary
result status
model_id
```

По серии warm runs публикуются:

```text
median latency
p90 latency
max latency
median peak VRAM
max peak VRAM
failure rate
```

## 9. Pass conditions

### Resource

```text
GPU count <= 1 × A100
```

и нет OOM при заявленном режиме обработки.

### CASE 1 latency

Для MVP release целевой pass:

```text
end-to-end response <= 60 sec
```

на representative workload, при этом отдельно фиксируется p90/max.

### CASE 2 latency

Целевой pass:

```text
end-to-end response <= 180 sec
```

на representative workload.

Если обработка выполняется быстрее horizon, это хорошо, но не позволяет модели использовать будущий материал за пределами fixed window.

## 10. Concurrency

Основной конкурсный benchmark — concurrency 1, если иное не согласовано.

Дополнительно полезно проверить concurrency 2–4 для понимания operational headroom, но это не должно менять основной acceptance profile.

При concurrency test фиксируются:

- queueing;
- peak VRAM;
- latency degradation;
- errors/OOM.

## 11. Docker / on-prem path

Benchmark запускается на том же типе deployment path, который заявляется для поставки:

```text
frontend/API
→ local network
→ connected runtime
→ result
```

Недостаточно измерить только `model.forward()` в notebook.

## 12. External network audit

Во время inference проверить, что mandatory path не требует внешней сети для:

- скачивания model weights;
- cloud inference;
- remote ASR/model API;
- telemetry, блокирующей execution.

Для on-prem acceptance все обязательные artifacts должны быть локальны.

## 13. Failure modes

Отдельно проверить:

- runtime cold-start timeout;
- GPU OOM;
- invalid audio;
- insufficient evidence;
- one runtime unavailable;
- full host restart / clean start.

Fail-closed status не считается модельным low-risk output.

## 14. Benchmark report template

```text
Benchmark ID:
Date:
Public commit:
Runtime build:
Container digests:
GPU/driver/CUDA:
CASE 1 model_id:
CASE 2 model_id:
Workload description:
Cold latency:
Warm median/p90/max:
Peak VRAM:
Peak RAM:
Failures:
External network required: yes/no
Pass/fail 1×A100:
Pass/fail CASE 1 <=60 sec:
Pass/fail CASE 2 <=180 sec:
Notes:
```

## 15. Что можно публиковать

В public repo безопасно публиковать aggregate benchmark results и environment identity без банковского аудио, transcript или row-level sensitive payload.

## 16. Итог

Resource compliance — это свойство **конкретного connected release**, а не абстрактного исходного кода.

Поэтому claim `1×A100 / <=60 sec / <=180 sec` должен появляться только после этого воспроизводимого benchmark.