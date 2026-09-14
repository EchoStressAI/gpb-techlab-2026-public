# Security Policy

## Scope

Этот репозиторий публичный и содержит только интеграционный слой конкурсного решения.

Пожалуйста, **не публикуйте в Issues, Pull Requests или Discussions**:

- реальные банковские аудиозаписи и транскрипты;
- персональные данные;
- внутренние model artifacts/weights;
- API keys, токены, пароли и иные секреты;
- внутренние исследовательские архивы или закрытые отчёты;
- информацию, раскрывающую приватную инфраструктуру.

## Reporting a security issue

Если вы обнаружили потенциальную уязвимость, которая может затрагивать чувствительные данные или private runtime, не прикладывайте чувствительные материалы в публичный issue.

Используйте приватный канал связи с командой EchoStressAI или механизм private security reporting GitHub, если он включён для репозитория.

## Repository boundary

Публичный код намеренно не содержит proprietary model implementation и закрытые serving artifacts. Model runtimes подключаются отдельно по локальному HTTP contract.

## Secrets

Ни один секрет не должен храниться в Git. Production secrets должны передаваться через инфраструктурные механизмы: secret manager, CI secret store, Docker/Kubernetes secrets или environment injection.

## Data handling

Integration layer не требует постоянного хранения аудио. Конкретный runtime обязан самостоятельно обеспечивать безопасную работу с temporary files, retention и cleanup.

## Supported version

В рамках конкурсного репозитория поддерживается актуальное состояние ветки `main`. Для воспроизводимости демонстрации рекомендуется фиксировать commit SHA и model_id подключённых runtime.
