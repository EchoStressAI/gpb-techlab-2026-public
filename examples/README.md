# Synthetic API examples

Все файлы в этой директории **синтетические** и предназначены только для документации/контрактных примеров.

Они:

- не являются результатами обработки реальных банковских звонков;
- не являются validation evidence;
- не содержат персональные данные;
- не должны использоваться как demo proof качества модели;
- используют `EXAMPLE_ONLY_*` model IDs.

## Файлы

- `case1_success.json` — пример успешного CASE 1 response;
- `case2_limited_evidence.json` — CASE 2 с ограниченным evidence;
- `readiness_ready.json` — оба runtime готовы;
- `runtime_unavailable.json` — пример 503 semantic payload;
- `runtime_contract_error.json` — пример 502 semantic payload.

Реальный runtime может возвращать дополнительные case-specific поля, если минимальный публичный контракт соблюдён.
