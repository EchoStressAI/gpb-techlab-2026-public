# Документация EchoStressAI · GPB TechLab 2026

Этот каталог — навигационная точка публичной документации решения. Репозиторий построен по принципу **public integration / private runtime**: публично описываются архитектура, интерфейсы, сценарии использования, валидация и ограничения; закрытые исследовательские пайплайны, датасеты, веса моделей и универсальная интегральная методология EchoStressAI в Git не публикуются.

## Быстрый маршрут

| Если нужно | Документ |
|---|---|
| Понять задачу и состав решения | [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) |
| Увидеть структуру репозитория | [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) |
| Понять архитектуру | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Понять границу IP / public-private | [IP_AND_PUBLIC_BOUNDARY.md](IP_AND_PUBLIC_BOUNDARY.md) |
| Понять общую методологию без закрытых формул | [METHODOLOGY.md](METHODOLOGY.md) |
| Понять научный контекст | [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md) |
| Разобраться в CASE 1 | [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md) |
| Разобраться в CASE 2 | [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md) |
| Понять expert review | [EXPERT_REVIEW_AND_VALIDATION.md](EXPERT_REVIEW_AND_VALIDATION.md) |
| Посмотреть публичные уроки экспертного разбора CASE 2 | [CASE2_EXPERT_REVIEW_LESSONS.md](CASE2_EXPERT_REVIEW_LESSONS.md) |
| Понять правила расчёта/публикации метрик | [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md) |
| Сопоставить ТЗ с компонентами решения | [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md) |
| Понять explainability | [EXPLAINABILITY.md](EXPLAINABILITY.md) |
| Понять quality/evidence | [QUALITY_AND_EVIDENCE.md](QUALITY_AND_EVIDENCE.md) |
| Понять error semantics | [ERROR_MODEL.md](ERROR_MODEL.md) |
| Интегрироваться с API | [API_REFERENCE.md](API_REFERENCE.md) |
| Интегрировать frontend | [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) |
| Реализовать case runtime | [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md) |
| Развернуть сервис | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Проверить системные требования | [SYSTEM_REQUIREMENTS.md](SYSTEM_REQUIREMENTS.md) |
| Посмотреть компоненты и зависимости | [COMPONENTS.md](COMPONENTS.md) |
| Понять test strategy | [TESTING.md](TESTING.md) |
| Использовать operations runbook | [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) |
| Провести демонстрацию | [DEMO_GUIDE.md](DEMO_GUIDE.md) |
| Понять требования к данным и ИБ | [DATA_PRIVACY_SECURITY.md](DATA_PRIVACY_SECURITY.md) |
| Понять ограничения и корректную интерпретацию | [LIMITATIONS_AND_RESPONSIBLE_USE.md](LIMITATIONS_AND_RESPONSIBLE_USE.md) |
| Воспроизвести техническую часть | [REPRODUCIBILITY.md](REPRODUCIBILITY.md) |
| Решить типовые проблемы | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Проверить готовность перед показом | [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md) |
| Посмотреть план развития public layer | [ROADMAP.md](ROADMAP.md) |
| Посмотреть команду и роли | [TEAM.md](TEAM.md) |
| Быстро найти ответ на вопрос | [FAQ.md](FAQ.md) |
| Расшифровать термин | [GLOSSARY.md](GLOSSARY.md) |

## Технические документы границы public/private

- [ARCHITECTURE.md](ARCHITECTURE.md) — архитектурная граница public/private runtime.
- [IP_AND_PUBLIC_BOUNDARY.md](IP_AND_PUBLIC_BOUNDARY.md) — как public code связан с proprietary/local runtime.
- [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md) — контракт локальных model runtime-компонентов.
- [PUBLIC_REPOSITORY_POLICY.md](PUBLIC_REPOSITORY_POLICY.md) — что допустимо и недопустимо публиковать.
- [../NOTICE.md](../NOTICE.md) — rights notice для публичного репозитория.
- [../SECURITY.md](../SECURITY.md) — публичная security policy.
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — правила изменений в public repo.

## Как читать документацию по ролям

### Жюри / заказчик

Начать с:

1. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
2. [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md)
3. [METHODOLOGY.md](METHODOLOGY.md)
4. [CASE1_MODEL_CARD.md](CASE1_MODEL_CARD.md)
5. [CASE2_MODEL_CARD.md](CASE2_MODEL_CARD.md)
6. [CASE2_EXPERT_REVIEW_LESSONS.md](CASE2_EXPERT_REVIEW_LESSONS.md)
7. [QUALITY_AND_EVIDENCE.md](QUALITY_AND_EVIDENCE.md)
8. [LIMITATIONS_AND_RESPONSIBLE_USE.md](LIMITATIONS_AND_RESPONSIBLE_USE.md)
9. [DEMO_GUIDE.md](DEMO_GUIDE.md)
10. [TEAM.md](TEAM.md)

### Разработчик интеграции

Начать с:

1. [ARCHITECTURE.md](ARCHITECTURE.md)
2. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
3. [API_REFERENCE.md](API_REFERENCE.md)
4. [ERROR_MODEL.md](ERROR_MODEL.md)
5. [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
6. [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md)
7. [DEPLOYMENT.md](DEPLOYMENT.md)
8. [TESTING.md](TESTING.md)
9. [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### ML / Data Science reviewer

Начать с:

1. [METHODOLOGY.md](METHODOLOGY.md)
2. [SCIENTIFIC_BACKGROUND.md](SCIENTIFIC_BACKGROUND.md)
3. [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md)
4. [EXPERT_REVIEW_AND_VALIDATION.md](EXPERT_REVIEW_AND_VALIDATION.md)
5. [CASE2_EXPERT_REVIEW_LESSONS.md](CASE2_EXPERT_REVIEW_LESSONS.md)
6. [QUALITY_AND_EVIDENCE.md](QUALITY_AND_EVIDENCE.md)
7. [REPRODUCIBILITY.md](REPRODUCIBILITY.md)
8. Model Cards.

### DevOps / ИБ

Начать с:

1. [SYSTEM_REQUIREMENTS.md](SYSTEM_REQUIREMENTS.md)
2. [DEPLOYMENT.md](DEPLOYMENT.md)
3. [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md)
4. [DATA_PRIVACY_SECURITY.md](DATA_PRIVACY_SECURITY.md)
5. [IP_AND_PUBLIC_BOUNDARY.md](IP_AND_PUBLIC_BOUNDARY.md)
6. [COMPONENTS.md](COMPONENTS.md)
7. [TESTING.md](TESTING.md)
8. [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md)

## Принципы документации

1. **Никаких фиктивных результатов.** Если runtime отсутствует, API сообщает об этом явно.
2. **Никаких скрытых подмен метрики.** Экспериментальные, экспертные и serving-результаты разделяются.
3. **Никакой ретроспективной подгонки.** Контрольные и экспертные разборы не используются для «улучшения» уже рассчитанной метрики задним числом.
4. **Разделение сигнала и интерпретации.** Акустический/эмоциональный сигнал не является медицинским диагнозом и не равен автоматически психологическому конструкту.
5. **Временная честность.** Поздний эпизод разговора не используется как объяснение score, рассчитанного на первых 60/180 секундах.
6. **Quality отдельно от score.** Недостаточность данных не должна маскироваться «низким риском».
7. **Technical failure отдельно от model decision.** 502/503 не превращаются в «нейтральный» model output.
8. **Минимально необходимая публичность.** Публикуется то, что нужно для понимания и интеграции решения, а не внутреннее know-how EchoStressAI.

## Статус документации

Документация описывает публичный integration contract и методологические границы проекта. По мере подключения финальных case runtime будут добавляться version-specific runtime/validation notes без раскрытия закрытых training artifacts или банковских данных.
