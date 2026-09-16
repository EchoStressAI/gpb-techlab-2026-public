# Model Risk Register · EchoStressAI GPB TechLab 2026

Этот реестр фиксирует основные model/product risks двух банковских кейсов и способы их контроля. Он не содержит proprietary coefficients, row-level bank data или internal training artifacts.

Статусы:

- **CONTROLLED** — есть технический/методологический control;
- **MONITOR** — требуется наблюдение в pilot/production;
- **VALIDATE** — нужен отдельный validation evidence;
- **RELEASE GATE** — без проверки конкретный release нельзя считать готовым.

## 1. Реестр

| Risk | Case | Почему важно | Control / mitigation | Status |
|---|---|---|---|---|
| Operator/workflow shortcut | CASE 1 | высокая метрика может отражать процесс оператора, а не состояние клиента | CLIENT-only PRIMARY; separate workflow stress-test; operator R&D claims separated | CONTROLLED |
| Недостаток client speech | CASE 1 | отсутствие сигнала может ошибочно выглядеть как low risk | `INSUFFICIENT_EVIDENCE` / evidence gate | CONTROLLED |
| Поздний материал попадает в early decision | CASE 1/2 | leakage относительно 60/180-sec contract | fixed horizon + temporal provenance | CONTROLLED |
| Score читается как probability | CASE 1/2 | опасная чрезмерная интерпретация | `score_is_probability` semantics, UI disclaimer, claims register | CONTROLLED |
| Wrong speaker/channel | CASE 1/2 | модель анализирует не того участника | role/channel validation + quality flags | MONITOR |
| Recording/domain shift | CASE 1/2 | телефония/микрофон/среда меняют acoustic distribution | pilot stratification + drift monitoring | VALIDATE |
| ASR/text errors | CASE 1 / optional CASE 2 text | semantic signal может искажаться | observable-text flags, abstain, acoustic fallback where appropriate | MONITOR |
| Identity leakage | CASE 2 | call-level split может узнавать голос сотрудника | employee-grouped / leave-person-out validation | CONTROLLED |
| Period score трактуется как диагноз одного звонка | CASE 2 | construct mismatch / HR harm | employee-period semantics + responsible-use UI | CONTROLLED |
| Emotion proxy трактуется как burnout | CASE 2 | negative affect != exhaustion/burnout | separate PRIMARY vs supporting state; expert review | CONTROLLED |
| Weak within-person dynamics | CASE 2 | сильный period AUC не гарантирует tracking changes | publish transition caveat; separate longitudinal validation | VALIDATE |
| Small relative reference | CASE 2 | TRAIN reference может выглядеть как population norm | explicitly label relative reference; no normative claim | CONTROLLED |
| CONTROL used post-hoc for tuning | CASE 1/2 | invalid independent evaluation | freeze model/protocol before CONTROL; new hypotheses -> new experiment | CONTROLLED |
| Expert review treated as ground truth | CASE 2 | construct/observer ambiguity | agreement metrics + disagreement taxonomy | CONTROLLED |
| Explainability overclaim | CASE 2 | XAI existence != ≥80% understandability | human acceptance protocol | RELEASE GATE |
| GPU/latency assumption without benchmark | CASE 1/2 | may violate 1×A100 / response-time constraints | release benchmark protocol | RELEASE GATE |
| External network dependency | CASE 1/2 | incompatible with on-prem | offline artifact check / network audit | RELEASE GATE |
| Third-party license incompatibility | CASE 1/2 | redistribution/on-prem risk | runtime manifest + license/SBOM review | RELEASE GATE |
| Runtime unavailable but UI looks successful | CASE 1/2 | false confidence | readiness + fail-closed 502/503; no fake score | CONTROLLED |
| Sensitive data in public Git/logs | all | privacy/security incident | hygiene gate + manual review + log minimization | CONTROLLED / MONITOR |
| Silent model replacement | all | metrics no longer correspond to deployed model | immutable `model_id`, artifact hash, release manifest | CONTROLLED |

## 2. Risk ownership

Рекомендуемая ответственность:

```text
model validity / leakage      → ML / Data Science
construct interpretation      → scientific/domain review
API/runtime contract          → backend/ML engineering
UI interpretation             → product/frontend
privacy/security              → technical owner + data owner
release/resource/license      → deployment/release owner
```

Конкретные персональные assignments можно вести во внутреннем project tracker, не обязательно в public repo.

## 3. Severity principle

Высокий риск — не только падение метрики. В human-state системах критичны также:

- неверная интерпретация корректного score;
- отсутствие evidence, замаскированное как negative;
- причинный вывод из корреляционного XAI;
- автоматическое значимое решение о человеке;
- data leakage / privacy breach.

Поэтому model risk рассматривается как сочетание:

```text
statistical quality
+ construct validity
+ data quality
+ deployment reliability
+ human interpretation
```

## 4. CASE 1 release gates

Перед сильным production claim проверить:

- CLIENT-only inference semantics;
- fixed 60-sec horizon;
- evidence gate;
- no operator/workflow shortcut in final input;
- frozen PR/ROC/F1 report;
- operational false-escalation / safe-negative behavior;
- on-prem/resource benchmark.

## 5. CASE 2 release gates

Перед сильным production claim проверить:

- frozen employee-period model identity;
- grouped validation;
- 180-sec horizon;
- reference semantics;
- within-person limitation documented;
- human explainability acceptance;
- BAT/BAT-12 / expert validation design for pilot;
- resource/on-prem benchmark.

## 6. Monitoring rule

Если в pilot появляется новый systematic failure mode, он:

1. добавляется в register;
2. получает owner/control;
3. не исправляется незаметно в той же validation history;
4. при model change создаёт новую version identity и новый evidence.

## 7. Public communication

Risk register не означает, что продукт «не готов». Он показывает, что для high-stakes human-state use case заранее определены failure modes и controls.

Корректная инженерная позиция:

> модель считается пригодной только для того scope, для которого одновременно подтверждены качество, sufficiency, interpretation и deployment behavior.