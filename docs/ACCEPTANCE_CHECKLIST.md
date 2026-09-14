# Acceptance Checklist

Этот checklist предназначен для внутренней проверки публичного submission repo перед демонстрацией или передачей ссылки.

## A. Public repository hygiene

- [ ] В `main` нет реальных банковских аудио.
- [ ] Нет реальных транскриптов/персональных данных.
- [ ] Нет `.env`, токенов, паролей, ключей.
- [ ] Нет training notebooks.
- [ ] Нет закрытых model weights без отдельного решения о публикации.
- [ ] Нет универсальной proprietary интегральной методологии EchoStressAI.
- [ ] Нет внутренних Drive paths, research archives и служебных handoff-файлов.
- [ ] Примеры и fixtures синтетические/безопасные.

## B. Repository health

- [ ] CI зелёный.
- [ ] `pytest -q` проходит в чистом окружении.
- [ ] Docker image собирается.
- [ ] `docker compose up --build` запускает API.
- [ ] `/health` возвращает 200.
- [ ] `/readiness` корректно отличает ready/not ready.

## C. Runtime contracts

### CASE 1

- [ ] runtime health доступен;
- [ ] `case_id=CASE_1`;
- [ ] horizon = 60;
- [ ] `model_id` присутствует;
- [ ] no-data/limited-data режим не превращается в фиктивный low-risk.

### CASE 2

- [ ] runtime health доступен;
- [ ] `case_id=CASE_2`;
- [ ] horizon = 180;
- [ ] `model_id` присутствует;
- [ ] quality/speech coverage доступны или явно описаны runtime;
- [ ] результат не формулируется как диагноз.

## D. Fail-closed tests

Проверить вручную или тестами:

- [ ] CASE 1 runtime URL отсутствует → 503;
- [ ] CASE 2 runtime URL отсутствует → 503;
- [ ] runtime не отвечает → 503;
- [ ] runtime 5xx → 503;
- [ ] invalid JSON → 502;
- [ ] wrong case id from runtime → 502;
- [ ] wrong horizon → 502;
- [ ] missing model id → 502.

## E. Demo readiness

- [ ] Подготовлены безопасные demo-файлы.
- [ ] Есть один пример CASE 1.
- [ ] Есть один пример CASE 2.
- [ ] Есть пример limited evidence / insufficient data.
- [ ] UI корректно показывает runtime unavailable.
- [ ] Есть prerecorded fallback demo, если live runtime сломается.
- [ ] На prerecorded demo явно указано, что это запись, а не текущий inference.

## F. Documentation

- [ ] README актуален.
- [ ] Architecture соответствует коду.
- [ ] API Reference соответствует endpoint.
- [ ] Runtime Contract соответствует gateway.
- [ ] Model Cards отражают текущий scope.
- [ ] Expert Review описывает ограничения, а не «идеальную точность».
- [ ] Responsible Use присутствует.
- [ ] Deployment описывает фактические env vars.

## G. Scientific/validation claims

- [ ] Ни одна метрика не публикуется без model version и protocol.
- [ ] CI не называется ML validation.
- [ ] Expert agreement не называется банковской ground truth.
- [ ] Mixed cases не спрятаны в удобную бинаризацию без объяснения.
- [ ] Несовпадение полного звонка и 60/180 sec window явно учтено.
- [ ] Emotion labels не интерпретируются как диагноз.

## H. Security

- [ ] Runtime ports не открыты наружу без необходимости.
- [ ] Secrets не передаются через Git.
- [ ] API production deployment предполагает TLS/auth.
- [ ] Логи не содержат аудио/полные транскрипты по умолчанию.
- [ ] Temporary audio удаляется после обработки в конкретном runtime.

## I. Release identity

Перед конкретным demo/release записать:

```text
public repo commit:
integration API version:
CASE 1 model_id:
CASE 2 model_id:
container tag/digest:
date/time:
CI run:
```

## J. Финальный smoke

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/api/v1/readiness
curl -X POST http://127.0.0.1:8080/api/v1/analyze \
  -F case_id=CASE_1 \
  -F file=@safe_case1_demo.wav
curl -X POST http://127.0.0.1:8080/api/v1/analyze \
  -F case_id=CASE_2 \
  -F file=@safe_case2_demo.wav
```

Итоговое правило: **лучше явно показать `not_ready` или `limited evidence`, чем скрыть проблему красивым, но недостоверным числом.**
