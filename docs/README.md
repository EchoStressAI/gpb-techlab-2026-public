# Документация · EchoStressAI × GPB TechLab 2026

Этот каталог — карта доказательств и технической документации конкурсного решения. Главный принцип проекта:

```text
public integration / UI / evidence
+
versioned local model runtime
```

Банковские данные, private weights, research notebooks и proprietary formulas в публичный Git не публикуются.

## Если вы из жюри — начните здесь

| Вопрос | Документ |
|---|---|
| Что это за решение и какие результаты? | [../README.md](../README.md) |
| Как проверить проект за 5–10 минут? | [REVIEWER_GUIDE.md](REVIEWER_GUIDE.md) |
| Какие метрики реально получены? | [PUBLIC_VALIDATION_RESULTS.md](PUBLIC_VALIDATION_RESULTS.md) |
| Соответствует ли решение ТЗ? | [GPB_TZ_COMPLIANCE.md](GPB_TZ_COMPLIANCE.md) |
| Что можно и нельзя утверждать публично? | [PUBLIC_CLAIMS_REGISTER.md](PUBLIC_CLAIMS_REGISTER.md) |
| Какие модели являются финальными PRIMARY? | [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md) · [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md) |
| Как устроена архитектура? | [ARCHITECTURE.md](ARCHITECTURE.md) · [DIAGRAMS.md](DIAGRAMS.md) |
| Как устроен Docker/on-prem контур? | [DEPLOYMENT.md](DEPLOYMENT.md) |
| На какой научной базе построен подход? | [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md) · [SCIENTIFIC_REFERENCES.md](SCIENTIFIC_REFERENCES.md) |
| Что ещё остаётся до финального release snapshot? | [release_evidence/PRE_RELEASE_MANIFEST.json](release_evidence/PRE_RELEASE_MANIFEST.json) |
| Кто в команде? | [TEAM.md](TEAM.md) |

---

## Evidence map

### 1. Product / scope

- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — задача и продуктовый контур.
- [SUBMISSION_MANIFEST.md](SUBMISSION_MANIFEST.md) — состав публичной поставки.
- [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md) — трассировка требований.
- [GPB_TZ_COMPLIANCE.md](GPB_TZ_COMPLIANCE.md) — point-by-point аудит официального ТЗ.
- [ROADMAP.md](ROADMAP.md) — развитие после конкурсного MVP.

### 2. Model semantics

- [METHODOLOGY.md](METHODOLOGY.md) — общая методология без закрытых формул.
- [MODEL_SEMANTICS.md](MODEL_SEMANTICS.md) — безопасная интерпретация model outputs.
- [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md) — CASE 1 PRIMARY.
- [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md) — CASE 2 PRIMARY.
- [MODEL_SELECTION_AUDIT.md](MODEL_SELECTION_AUDIT.md) — почему выбраны именно эти serving-ветки.

### 3. Validation / claims

- [PUBLIC_VALIDATION_RESULTS.md](PUBLIC_VALIDATION_RESULTS.md) — aggregate competition metrics.
- [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md) — правила расчёта и публикации метрик.
- [VALIDATION_EVIDENCE_INDEX.md](VALIDATION_EVIDENCE_INDEX.md) — где лежит evidence каждого типа.
- [PUBLIC_CLAIMS_REGISTER.md](PUBLIC_CLAIMS_REGISTER.md) — допустимые и недопустимые формулировки.
- [EXPERT_REVIEW_AND_VALIDATION.md](EXPERT_REVIEW_AND_VALIDATION.md) — роль экспертной проверки.
- [CASE2_EXPERT_REVIEW_LESSONS.md](CASE2_EXPERT_REVIEW_LESSONS.md) — публичные выводы expert review CASE 2.

### 4. Scientific basis

- [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md) — научный контекст.
- [SCIENTIFIC_REFERENCES.md](SCIENTIFIC_REFERENCES.md) — ключевые источники.
- [GPB_SCIENTIFIC_SOURCE_MAP.md](GPB_SCIENTIFIC_SOURCE_MAP.md) — связь источников из ТЗ с проектом.

### 5. Explainability / quality / responsible use

- [EXPLAINABILITY.md](EXPLAINABILITY.md) — объяснения модели.
- [EXPLAINABILITY_ACCEPTANCE_PROTOCOL.md](EXPLAINABILITY_ACCEPTANCE_PROTOCOL.md) — human acceptance ≥80%.
- [QUALITY_AND_EVIDENCE.md](QUALITY_AND_EVIDENCE.md) — quality/evidence semantics.
- [ERROR_MODEL.md](ERROR_MODEL.md) — технические и модельные ошибки.
- [LIMITATIONS_AND_RESPONSIBLE_USE.md](LIMITATIONS_AND_RESPONSIBLE_USE.md) — границы интерпретации.
- [MODEL_RISK_AND_PILOT_MONITORING.md](MODEL_RISK_AND_PILOT_MONITORING.md) — model risk / drift / pilot monitoring.

### 6. Architecture / API / frontend

- [ARCHITECTURE.md](ARCHITECTURE.md) — архитектура решения.
- [DIAGRAMS.md](DIAGRAMS.md) — схемы.
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) — структура repository.
- [API_REFERENCE.md](API_REFERENCE.md) — integration API.
- [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md) — contract case-specific runtime.
- [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) — frontend integration.
- [EXAMPLES.md](EXAMPLES.md) — синтетические API-примеры.
- [DEMO_GUIDE.md](DEMO_GUIDE.md) — демонстрационный сценарий.

### 7. Deployment / release

- [DEPLOYMENT.md](DEPLOYMENT.md) — Docker/on-prem deployment.
- [SYSTEM_REQUIREMENTS.md](SYSTEM_REQUIREMENTS.md) — системные требования.
- [COMPONENTS.md](COMPONENTS.md) — компоненты.
- [DEPENDENCIES_AND_LICENSES.md](DEPENDENCIES_AND_LICENSES.md) — dependencies / license governance.
- [RESOURCE_BENCHMARK_PROTOCOL.md](RESOURCE_BENCHMARK_PROTOCOL.md) — A100 / latency benchmark protocol.
- [TECHNICAL_ACCEPTANCE_EVIDENCE.md](TECHNICAL_ACCEPTANCE_EVIDENCE.md) — technical acceptance evidence.
- [PUBLIC_RELEASE_VERSIONING.md](PUBLIC_RELEASE_VERSIONING.md) — правила evaluator snapshot/versioning.
- [release_evidence/](release_evidence/) — machine-readable и human-readable release evidence.

### 8. Security / IP / operations

- [IP_AND_PUBLIC_BOUNDARY.md](IP_AND_PUBLIC_BOUNDARY.md) — public/private IP boundary.
- [PUBLIC_REPOSITORY_POLICY.md](PUBLIC_REPOSITORY_POLICY.md) — правила публичного repository.
- [DATA_PRIVACY_SECURITY.md](DATA_PRIVACY_SECURITY.md) — данные и ИБ.
- [THREAT_MODEL_AND_DATA_LIFECYCLE.md](THREAT_MODEL_AND_DATA_LIFECYCLE.md) — threat model и lifecycle данных.
- [../SECURITY.md](../SECURITY.md) — security policy.
- [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) — эксплуатация.
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — диагностика.
- [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md) — pre-demo / pre-release checklist.

### 9. Reproducibility / testing

- [TESTING.md](TESTING.md) — test strategy.
- [REPRODUCIBILITY.md](REPRODUCIBILITY.md) — воспроизводимость public/integration слоя.
- [PUBLIC_HYGIENE_GATE.md](PUBLIC_HYGIENE_GATE.md) — public hygiene checks.

### 10. Team / FAQ

- [TEAM.md](TEAM.md) — роли и компетенции команды.
- [FAQ.md](FAQ.md) — вопросы жюри и технического review.
- [GLOSSARY.md](GLOSSARY.md) — термины.

---

## Маршруты по ролям

### Жюри / заказчик

```text
README
→ Reviewer Guide
→ Validation Results
→ Model Cards
→ Architecture
→ GPB TZ Compliance
→ Demo
→ Team
```

### ML / Data Science reviewer

```text
Methodology
→ Model Selection Audit
→ Model Cards
→ Validation Protocol / Results
→ Expert Review
→ Scientific References
```

### Developer / integration

```text
Architecture
→ API Reference
→ Runtime Contract
→ Frontend Integration
→ Examples
→ Testing
```

### DevOps / ИБ

```text
System Requirements
→ Deployment
→ Threat Model / Data Lifecycle
→ Dependencies / Licenses
→ Operations Runbook
→ Acceptance Checklist
```

---

## Принципы документации

1. **Никаких фиктивных результатов.** Недоступный runtime не превращается в synthetic score.
2. **PRIMARY отделён от supporting/R&D.** Высокая экспериментальная метрика не переносится на serving claim без оснований.
3. **CONTROL не используется ретроспективно.** Скрытая разметка не подменяется догадками.
4. **Signal ≠ diagnosis.** Речевой model signal не равен медицинскому или кадровому заключению.
5. **Quality отдельно от score.** Недостаток данных не маскируется низким риском.
6. **CI ≠ ML validation.** Software checks и model quality подтверждаются разным evidence.
7. **Explainability ≠ causal explanation.** UI объясняет поведение модели, а не доказывает психологическую причинность.
8. **Минимально необходимая публичность.** Публикуется достаточно для проверки решения, но не proprietary core EchoStressAI.

Документация описывает текущий public integration contract и зафиксированные model/validation claims. Release-specific поля обновляются только из измеренного evidence конкретного snapshot.
