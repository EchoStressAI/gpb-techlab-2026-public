# Reviewer Guide · EchoStressAI × GPB TechLab 2026

Этот маршрут рассчитан на жюри, заказчика и технического reviewer. За **5–10 минут** он должен дать ответ на пять вопросов:

1. что именно решает система;
2. какие результаты уже получены;
3. как устроен demo/product flow;
4. чем подтверждаются claims;
5. что ещё относится к release-specific acceptance, а не объявляется выполненным заранее.

---

## 30 секунд: суть решения

**EchoStressAI — речевой ИИ-контур для двух банковских сценариев:**

|  | CASE 1 | CASE 2 |
|---|---|---|
| Задача | возможное внешнее воздействие на клиента | неблагоприятное состояние / риск выгорания сотрудника |
| Сторона | клиент | сотрудник поддержки |
| Окно | первые **60 сек** | первые **180 сек** |
| PRIMARY | `CASE1_INDUCTIVE_CDF_PRIMARY_V1` | `CASE2_OPEN_ACOUSTIC11_ORIENTED_V1` |
| Семантика | ранний ranking signal + evidence sufficiency | relative employee-period signal |

Система не заменяет банковский регламент, медицинскую оценку или решение HR. Она добавляет **ранний измеримый сигнал + объяснение + контроль достаточности данных**.

---

## 1 минута: ключевые результаты

| Метрика | CASE 1 | CASE 2 |
|---|---:|---:|
| PR AUC | **0.3654** | **0.8060** |
| ROC AUC | **0.7569** | **0.8701** |
| Weighted F1 | **0.8190** | — |
| Operator-equal ROC AUC | — | **0.8818** |

Что важно при чтении цифр:

- CASE 1 PRIMARY — **CLIENT-only**; высокий operator-side result не используется как production claim после shortcut audit;
- CASE 2 `ROC AUC 0.8701` относится к текущему competition/internal employee-period protocol, а не к заявлению об окончательной внешней population validation;
- CONTROL без открытой ground truth не превращается в самостоятельно заявленную AUC;
- score в обоих кейсах — не calibrated probability.

Evidence: [PUBLIC_VALIDATION_RESULTS.md](PUBLIC_VALIDATION_RESULTS.md) · [MODEL_SELECTION_AUDIT.md](MODEL_SELECTION_AUDIT.md) · [PUBLIC_CLAIMS_REGISTER.md](PUBLIC_CLAIMS_REGISTER.md).

---

## Что смотреть на демонстрации

### Шаг 1 · загрузка

Загружается одна запись или batch. CASE выбирается явно, а модель получает только разрешённое временное окно.

### Шаг 2 · PRIMARY

**CASE 1:** основной client-side сигнал + зона решения.  
**CASE 2:** relative employee-period score / band.

### Шаг 3 · evidence / quality

Reviewer должен проверить, что система умеет **не выдавать красивое число любой ценой**:

- недостаток клиентской речи → `INSUFFICIENT_EVIDENCE`;
- недоступный runtime → fail-closed;
- quality/supporting state отделены от PRIMARY;
- отсутствие observation не трактуется как безопасность.

### Шаг 4 · объяснение

CASE 2 показывает public-safe смысловые группы факторов, а не proprietary coefficients/contributions. CASE 1 показывает достаточность наблюдения, supporting state/evidence и следующий шаг, но supporting слой не выдаётся за вход PRIMARY.

### Шаг 5 · действие

Результат заканчивается human-in-the-loop следующим шагом, а не автономным решением о клиенте или сотруднике.

---

## Почему это техническая поставка, а не исследовательский notebook

В проекте разделены четыре контура:

```text
Research
   ↓ freeze / validation
Frozen model runtime
   ↓ versioned contract
Integration API + Frontend
   ↓ release gates
Docker / on-prem evaluator snapshot
```

Проверяемые свойства:

- versioned `model_id` для обоих PRIMARY;
- fixed horizons 60/180 сек;
- API contract и case routing;
- frontend build/typecheck;
- Docker/compose;
- fail-closed behavior;
- public/private IP boundary;
- shortcut/confound audit;
- version-specific validation evidence;
- release-evidence tooling.

Архитектура: [ARCHITECTURE.md](ARCHITECTURE.md) · [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md) · [SUBMISSION_MANIFEST.md](SUBMISSION_MANIFEST.md).

---

## Что особенно проверить в CASE 1

Reviewer должен увидеть:

1. финальный сигнал строится по **клиентской стороне**;
2. модель ограничена первыми **60 сек**;
3. ranking score не подписан как вероятность;
4. `INSUFFICIENT_EVIDENCE` имеет приоритет над числом score;
5. operator-workflow shortcut не перенесён в финальный claim;
6. supporting state/evidence визуально и семантически отделены от PRIMARY.

Подробнее: [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md).

---

## Что особенно проверить в CASE 2

Reviewer должен увидеть:

1. анализируется речь сотрудника в первых **180 сек**;
2. PRIMARY интерпретируется на уровне employee-period / series-of-observations;
3. score не является медицинским диагнозом или вероятностью выгорания;
4. explanation описывает поведение модели, а не психологическую причинность;
5. supporting fatigue/distress не выдаются за вход Acoustic PRIMARY;
6. история не раскрывает exact model internals и технические thresholds.

Подробнее: [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md).

---

## Что уже закрыто по ТЗ

В public/source слое можно проверить:

- два независимых сценария;
- 60/180-sec contracts;
- UI загрузки и результата;
- batch/postprocessing semantics;
- Python/FastAPI integration backend;
- Docker build;
- on-prem architecture;
- научную методологию;
- CASE 1 / CASE 2 validation evidence;
- документацию архитектуры, deployment и компонентов.

Отдельным release evidence остаются measured A100/latency, final image digest/SBOM/E2E и human explainability acceptance ≥80%.

Полная матрица: [GPB_TZ_COMPLIANCE.md](GPB_TZ_COMPLIANCE.md).

---

## Как читать evidence

Не смешивать:

```text
software CI
≠ ML performance
≠ semantic/expert validation
≠ human explainability acceptance
≠ measured deployment benchmark
≠ business effect
```

Поэтому наличие зелёного CI не используется как доказательство AUC, а наличие XAI-компонента — как автоматическое доказательство критерия понятности ≥80%.

Навигация: [VALIDATION_EVIDENCE_INDEX.md](VALIDATION_EVIDENCE_INDEX.md).

---

## Public / private boundary

Публично проверяются:

- integration API;
- frontend;
- routing/contracts;
- Docker/CI;
- model identities;
- aggregate validation;
- scientific/methodological rationale;
- safe explanation semantics.

Не публикуются:

- банковские аудио/транскрипты;
- training datasets и research notebooks;
- private weights/checkpoints;
- exact proprietary coefficients/scalers/imputers/thresholds;
- внутренняя anxiety formula;
- universal integral/fusion/personal-baseline methodology.

Подробнее: [IP_AND_PUBLIC_BOUNDARY.md](IP_AND_PUBLIC_BOUNDARY.md).

---

## 5-минутный маршрут по репозиторию

1. **[README](../README.md)** — продукт, результаты, demo path.
2. **[PUBLIC_VALIDATION_RESULTS.md](PUBLIC_VALIDATION_RESULTS.md)** — метрики и caveats.
3. **[CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md)** / **[CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md)** — модельные границы.
4. **[ARCHITECTURE.md](ARCHITECTURE.md)** — технический контур.
5. **[GPB_TZ_COMPLIANCE.md](GPB_TZ_COMPLIANCE.md)** — ТЗ point-by-point.
6. **[PUBLIC_CLAIMS_REGISTER.md](PUBLIC_CLAIMS_REGISTER.md)** — что команда готова утверждать публично, а что сознательно не завышает.
7. **[TEAM.md](TEAM.md)** — компетенции команды.

Если есть ещё пять минут: [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md) · [EXPERT_REVIEW_AND_VALIDATION.md](EXPERT_REVIEW_AND_VALIDATION.md) · [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Техническая smoke-проверка

После запуска public integration layer:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -i http://127.0.0.1:8080/api/v1/readiness
```

`/health` означает, что API жив. `/readiness` проверяет connected runtime. ML quality подтверждается отдельным validation evidence — эти уровни не подменяют друг друга.

---

## Финальный критерий хорошего demo

После демонстрации reviewer должен унести четыре ясных тезиса:

> **1. Два кейса действительно разные и имеют разные PRIMARY/окна.**  
> **2. Результаты измерены и не завышены shortcut/CONTROL claims.**  
> **3. Система умеет честно отказаться от вывода при недостатке evidence.**  
> **4. Это уже интеграционный продуктовый контур с UI/API/Docker/on-prem, а не только исследовательская модель.**
