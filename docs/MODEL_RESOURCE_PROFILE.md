# Model & Resource Profile · GPB TechLab 2026

Этот документ фиксирует **архитектурный и ресурсный профиль** решения без раскрытия model weights, exact feature coefficients или proprietary decision formulas.

## 1. Основной принцип

EchoStressAI использует не одну монолитную модель, а несколько разделённых слоёв:

```text
speech/audio input
→ role/window control
→ acoustic / semantic / representation layers
→ case-specific PRIMARY scorer
→ quality/evidence
→ safe explanation / recommendation
```

Такое разделение позволяет выбирать для каждого слоя наиболее подходящую технологию и не делать финальный business scorer сложнее только ради архитектурной однородности.

## 2. Не LLM

В финальном scoring path не требуется генеративная LLM.

Это важно для:

- on-prem deployment;
- предсказуемой latency;
- меньшего ресурсного профиля;
- более простого version control;
- снижения риска неконтролируемой генерации;
- объяснимости финального результата.

Speech/audio Transformer не является LLM: он может использоваться как encoder/representation model без генеративного textual reasoning.

## 3. CASE 1

CASE 1 предназначен для раннего model signal по клиенту в пределах 60 секунд.

Public-safe архитектурная семантика:

```text
client speech
+ semantic/text representation
+ supporting speech-state context
→ client-only PRIMARY
→ evidence gate
→ decision status
```

Речь оператора не должна становиться скрытым shortcut финального PRIMARY.

Точный vectorizer/scorer, внутренние coefficients, thresholds и формула supporting state остаются внутри versioned runtime.

## 4. CASE 2

CASE 2 PRIMARY ориентирован на объяснимый acoustic path.

На смысловом уровне используются семейства:

- prosody / pitch;
- energy / intensity;
- timing / pauses;
- voice quality;
- spectral descriptors;
- агрегаты по релевантным речевым сегментам.

В исследовании сравнивались более сложные варианты, включая textual/fusion branches. В PRIMARY сохраняется более простой путь, если он даёт сопоставимое или лучшее validated quality при меньшей сложности deployment.

Это сознательный engineering choice, а не отсутствие текстового исследования.

## 5. Supporting state layer

Отдельный state layer может использовать speech representations/эмоциональные embeddings и другие model heads для описания текущего состояния.

Он **не должен автоматически сливаться с PRIMARY business score**, если строгая validation не показывает устойчивого прироста.

Тем самым разделяются:

```text
business risk
current state
emotion representation
quality/evidence
```

## 6. Open-source / model governance

Для каждого connected runtime release должны быть зафиксированы:

```text
model_id
model family
source/owner
license
framework version
runtime version
artifact hash
allowed-use / redistribution status
```

Public repository сам по себе не является model registry.

## 7. Запрещённые готовые модели из ТЗ

Release review должен отдельно подтверждать, что финальный GPB runtime не использует как готовые модели решения:

```text
TIM-Net
«АБК»
GigaAM Emo
```

Отсутствие этих artifacts в public Git недостаточно: проверка должна выполняться и на connected runtime manifest.

## 8. GPU ceiling

ТЗ задаёт ограничение **1 × NVIDIA A100**.

Public integration/API/frontend layer:

- GPU не требует;
- может работать отдельно от model runtime;
- не должен влиять на GPU budget model serving.

Connected runtime должен пройти release-level benchmark в пределах согласованного ceiling.

## 9. Что должен содержать ресурсный benchmark

Минимальный benchmark record:

```text
GPU model
CUDA/driver
runtime/model versions
input duration
CASE 1 / CASE 2
wall-clock latency
peak GPU memory
peak host RAM
number of concurrent jobs
container/image identity
warm/cold start distinction
```

Для конкурсного acceptance особенно важно проверить:

- CASE 1: end-to-end результат в допустимом 60-sec режиме;
- CASE 2: end-to-end результат в допустимом 180-sec режиме;
- совместимость двух runtime с 1×A100 deployment ceiling.

## 10. Почему нельзя публиковать теоретическую latency как измеренную

Наличие лёгкой модели или A100 ещё не доказывает итоговую latency всего pipeline.

End-to-end время включает:

```text
decode
+ segmentation/VAD
+ optional ASR
+ feature extraction
+ model inference
+ aggregation
+ XAI
+ serialization
```

Поэтому performance claim публикуется только после benchmark конкретного release.

## 11. CPU-only части

Часть task-specific scorers и integration logic может работать на CPU. Это позволяет не занимать GPU теми стадиями, где ускоритель не даёт существенной пользы.

Архитектурная цель — использовать GPU только там, где он действительно нужен encoder/model layer.

## 12. Offline/on-prem

Для закрытого банковского контура runtime должен быть подготовлен так, чтобы processing не требовал во время inference:

- скачивания weights из внешнего Git/Hugging Face;
- обращения к внешнему proprietary API;
- внешней телеметрии, обязательной для model execution.

Все необходимые artifacts и dependencies должны быть доступны локально.

См. также [SYSTEM_REQUIREMENTS.md](SYSTEM_REQUIREMENTS.md), [DEPLOYMENT.md](DEPLOYMENT.md) и [DATA_PRIVACY_SECURITY.md](DATA_PRIVACY_SECURITY.md).

## 13. Итог

Требование быстрой non-LLM архитектуры интерпретируется как engineering constraint на **полный runtime**, а не как требование сделать каждый downstream classifier одинаковым Transformer-блоком.

Финальный release должен одновременно подтверждать:

```text
quality
+ explainability
+ fixed horizon
+ 1×A100 resource ceiling
+ on-prem reproducibility
```

Именно такой набор evidence важнее декларации конкретного model class.