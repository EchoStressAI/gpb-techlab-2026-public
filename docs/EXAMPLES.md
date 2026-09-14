# Синтетические примеры API

Директория [`examples/`](../examples/) содержит только **синтетические documentation fixtures**. Они показывают форму контракта и не являются результатами реальных банковских звонков или доказательством качества модели.

## CASE 1

[`examples/case1_success.json`](../examples/case1_success.json)

Показывает:

- `case_id=CASE_1`;
- horizon 60 sec;
- synthetic score;
- quality;
- XAI/supporting structure;
- explicit `example_only=true`.

## CASE 2

[`examples/case2_limited_evidence.json`](../examples/case2_limited_evidence.json)

Показывает важный продуктовый случай:

```text
model signal calculated
+
LIMITED_EVIDENCE
```

Это демонстрирует, почему quality нельзя сворачивать в бинарный «норма/риск».

Пример намеренно содержит `NO_AUTOMATED_DECISION` и не предназначен для принятия решения о человеке.

## Readiness

[`examples/readiness_ready.json`](../examples/readiness_ready.json)

Оба runtime доступны, horizons и model IDs согласованы.

## Runtime unavailable

[`examples/runtime_unavailable.json`](../examples/runtime_unavailable.json)

Показывает semantic payload HTTP 503. В этом состоянии реальный score отсутствует.

## Contract error

[`examples/runtime_contract_error.json`](../examples/runtime_contract_error.json)

Показывает HTTP 502 при несовместимом runtime contract, например horizon mismatch.

## Почему примеры синтетические

Public CI/docs не должны зависеть от:

- реального банковского аудио;
- private model weights;
- персональных данных;
- закрытых labels.

Поэтому examples предназначены для:

- frontend development;
- contract discussion;
- documentation;
- безопасных screenshots;
- тестирования rendering/error states.

Они **не заменяют** end-to-end smoke с реальным runtime перед demo.

## Как использовать во frontend

Frontend разработчик может использовать JSON как mock fixture для отображения карточек, но интерфейс должен явно иметь отдельный demo/test mode. Такие fixtures не должны автоматически включаться в production path.
