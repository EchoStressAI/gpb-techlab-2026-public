# Pilot Acceptance Plan · Газпромбанк

Этот документ описывает рекомендуемую схему пилота после конкурсного MVP. Это **план проверки**, а не утверждение о уже достигнутом производственном эффекте.

## 1. Общая цель

Пилот должен ответить не только на вопрос «какая AUC у модели», но и на четыре практических вопроса:

1. добавляет ли сигнал модели ценность к существующему процессу;
2. насколько часто система создаёт лишнюю эскалацию;
3. понимает ли пользователь объяснение и следующий шаг;
4. стабильно ли решение работает в on-prem operational contour.

## 2. Фазы

```text
Phase 0 · offline replay / acceptance
Phase 1 · shadow mode
Phase 2 · supervised human-in-the-loop pilot
Phase 3 · decision on production scope
```

Автоматические значимые решения не требуются для подтверждения ценности MVP.

---

# CASE 1 · внешний психологический контекст

## 3. Phase 0 · replay

На историческом labeled наборе фиксируются:

- model/runtime version;
- 60-sec protocol;
- PR AUC / ROC AUC / weighted F1;
- evidence insufficiency rate;
- safe-negative / escalation operating point;
- latency/resource profile.

Никаких threshold changes после просмотра final pilot labels в рамках того же protocol.

## 4. Phase 1 · shadow mode

Модель считает звонки параллельно существующему process, но не меняет банковское решение.

Собирать агрегированно:

```text
additional detections
false escalations
safe-negative coverage
verification time
model abstain / insufficient evidence
technical failure rate
latency
```

Если доступна downstream ground truth, отдельно связывать model outcome с фактическим fraud/transaction result.

## 5. CASE 1 business metrics

Не сводить эффект только к AUC.

Проверять:

- сокращение времени проверки для безопасного потока;
- additional detection в risk flow;
- false escalation burden;
- verification time;
- prevented fraud loss / avoided loss — только если есть валидная банковская методика attribution.

Экономический эффект нельзя объявлять доказанным до такой pilot measurement.

## 6. Go/no-go CASE 1

Пример go criteria определяется Банком до запуска и может включать:

- качество не ниже согласованного threshold;
- false escalation в операционно допустимом диапазоне;
- latency в пределах process;
- evidence/abstain не разрушает coverage;
- отсутствие критичных security/data incidents;
- понятный operator flow.

---

# CASE 2 · employee-period risk

## 7. Pilot design

CASE 2 требует отличать:

```text
single-call acoustic signal
от
sustained employee-period construct
```

Поэтому основной пилот должен собирать repeated observations, а не один звонок на человека.

## 8. Confirmatory reference

Для проверки construct рекомендуется использовать:

- BAT / BAT-12 или согласованную Банком психометрическую шкалу;
- экспертную оценку по зафиксированному protocol;
- рабочие HR/quality outcomes, если они доступны и допустимы.

Voice score не объявляется заменой психометрии без отдельного evidence.

## 9. CASE 2 pilot metrics

Model quality:

- employee-period ROC/PR AUC;
- operator/employee-grouped stability;
- within-person change metrics;
- speech-coverage-conditioned performance.

Human/product quality:

- explainability acceptance ≥ согласованного критерия;
- доля пользователей, правильно понимающих score semantics;
- доля замеченных quality warnings;
- useful-action acceptance.

Operational:

- latency;
- runtime failure rate;
- percentage insufficient evidence;
- repeatability across recording conditions.

## 10. HR safety rule

На pilot stage результат должен использоваться как **human-in-the-loop signal**, а не как автоматическое основание для:

- увольнения;
- дисциплинарного решения;
- ограничения допуска;
- медицинского заключения;
- страхового решения.

Если Банк рассматривает иной high-stakes use case, требуется отдельная legal/ethical/process validation.

## 11. History / chronology

Если используется employee history:

- identity mapping должен быть корректным;
- history строится causal/as-of;
- будущие звонки не могут объяснять прошлый результат;
- смена technical external ID не должна создавать фиктивную персональную trajectory.

## 12. Data governance

До пилота согласовать:

```text
data controller/owner
processing purpose
retention period
audio/transcript storage
access roles
logging policy
model-output retention
incident process
public/private publication boundary
```

Public Git не используется для pilot data.

## 13. Technical acceptance

На pilot snapshot фиксируются:

- public commit/tag;
- model IDs;
- runtime/container digests;
- dependency/SBOM manifest;
- 1×A100 benchmark;
- on-prem network topology;
- E2E smoke;
- rollback version.

## 14. Change management

Во время pilot:

- bugfix integration layer может выпускаться отдельной version;
- model/threshold/preprocessing change → новая model/runtime identity;
- метрики до и после model change не смешиваются как один release result;
- новые hypotheses из CONTROL/pilot data проверяются отдельным experiment/protocol.

## 15. Decision package после пилота

Итоговый пакет должен содержать:

```text
1. Technical acceptance
2. Model validation
3. Human/expert validation
4. Operational metrics
5. Error/risk analysis
6. Business-effect estimate with assumptions
7. Security/data-governance outcome
8. Recommended production scope
9. Known limitations
10. Rollback / monitoring plan
```

## 16. Возможные решения

```text
GO
GO WITH LIMITATIONS
EXTEND PILOT
RETRAIN / CHANGE TARGET
NO-GO FOR CURRENT SCOPE
```

Решение может различаться для CASE 1 и CASE 2.

## 17. Итог

Цель pilot — не «доказать, что модель хорошая», а определить **где, при каких условиях и с какой операционной ценностью её сигнал воспроизводимо полезен**.

Именно такой результат является основой production/on-prem решения Банка.