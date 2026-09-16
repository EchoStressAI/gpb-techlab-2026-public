# Security Threat Model · Public / On-prem Architecture

Этот документ описывает основные security threats для public integration + frontend + local model runtime. Он не содержит production hostnames, credentials, internal network addresses или банковские данные.

## 1. Assets

Защищаемые активы:

- банковские аудиозаписи;
- транскрипты;
- employee/client identifiers;
- model outputs и audit history;
- access tokens / credentials;
- private model artifacts;
- proprietary feature/scoring implementation;
- integrity model/version identity;
- availability inference service.

## 2. Trust boundaries

```text
User browser
   ↓ authenticated connection
Frontend / reverse proxy
   ↓ API auth
Public integration API
   ↓ private/local service network
CASE 1 / CASE 2 runtime
   ↓ local model artifacts / temporary processing
Protected storage/runtime environment
```

Public GitHub находится **вне** банковского trusted data contour и не должен содержать runtime secrets/data.

## 3. Threat: secret leakage into Git

### Scenario

Token/password/private key/production endpoint попадает в source, docs, issue, PR или commit message.

### Controls

- public hygiene gate;
- forbidden secret-like files/patterns;
- manual diff review;
- secret manager/environment injection;
- incident rule: leaked secret is rotated/revoked, а не просто удалён новым commit.

### Residual risk

Git history/PR metadata публичны; automatic tree scan не гарантирует очистку истории.

## 4. Threat: sensitive audio/transcript leakage

### Scenario

Raw audio, transcript или identifier попадает в logs/public artifacts/debug dumps.

### Controls

- no bank audio/transcripts in public Git;
- log minimization;
- temporary-file cleanup;
- no full multipart payload logging;
- private storage/access controls;
- public examples synthetic only.

## 5. Threat: malicious / oversized upload

### Scenario

Большой или некорректный файл вызывает DoS, parser failure или excessive resource use.

### Controls

- upload size limits;
- allowed-format validation;
- bounded timeouts;
- isolated decoding/runtime process;
- error response instead of retry loop;
- queue/concurrency limits в production deployment.

Дополнительно для hardening рекомендуется fuzz/negative testing media decode layer.

## 6. Threat: filename/path traversal

### Scenario

Пользовательский filename используется как local filesystem path.

### Controls

- generated temporary names;
- ignore untrusted path components;
- fixed temporary directory;
- no persistence by original filename;
- cleanup after processing.

## 7. Threat: unauthorized model/result access

### Scenario

Пользователь получает transcript/risk/audit fields без соответствующего permission.

### Controls

- authenticated API;
- scope/role-based authorization;
- frontend hides inaccessible sections for UX, но server remains source of authorization;
- audit sensitive result access;
- least-privilege runtime/service tokens.

Frontend visibility **не является security boundary**.

## 8. Threat: browser token theft / XSS

### Scenario

Если access token хранится в browser-accessible storage, XSS может получить его.

### Current public-demo implication

Public frontend демонстрирует token-based access. Для production-grade deployment предпочтительна более сильная session/proxy pattern, при которой long-lived privileged token не доступен application JavaScript.

### Controls / recommendations

- strict CSP;
- no untrusted HTML injection;
- short-lived/scoped tokens;
- proxy/session option;
- TLS;
- token rotation;
- avoid embedding secrets at build time.

## 9. Threat: public runtime ports exposed externally

### Scenario

CASE runtimes доступны из public network и обходят integration/auth boundary.

### Controls

- runtime only on private Docker/internal network;
- no host port publication unless operationally required;
- firewall/network policy;
- integration service as controlled gateway.

## 10. Threat: runtime impersonation / wrong model

### Scenario

Integration API получает ответ от неверного/устаревшего service или model artifact.

### Controls

- validate `case_id`;
- validate fixed horizon;
- require `model_id`;
- release manifest + artifact hash;
- readiness tied to expected PRIMARY;
- container digest/versioning.

## 11. Threat: model output leakage / extraction

### Scenario

Публичный API возвращает слишком детальные intermediate outputs, exact coefficients или feature vectors, облегчая reverse engineering model IP.

### Controls

- public-safe output projection;
- no raw intermediate probabilities where unnecessary;
- no exact coefficients/scaler/imputer parameters;
- safe semantic XAI instead of full internal feature table;
- rate/access controls in deployment.

## 12. Threat: false-success behavior

### Scenario

Runtime отсутствует/ошибается, но UI/API показывает сохранённый, нулевой или synthetic score.

### Controls

- fail-closed gateway;
- readiness separate from health;
- 502/503 technical errors separate from model outcome;
- no fake model fallback in public evaluation path.

## 13. Threat: external dependency breaks on-prem

### Scenario

Inference требует внешнего API, download model weights или blocking telemetry.

### Controls

- offline artifact packaging;
- external-network audit;
- local dependency/runtime manifest;
- reproduce after network isolation.

## 14. Threat: dependency / supply-chain vulnerability

### Controls

Release-level:

- resolved dependency inventory;
- SBOM;
- vulnerability scan;
- image digest;
- trusted base images;
- lockfiles where practical;
- review third-party license/source.

## 15. Threat: model abuse / high-stakes misuse

### Scenario

CASE 2 score используется как automated employment/medical decision или CASE 1 как единственное основание значимого действия.

### Controls

- responsible-use rules;
- human-in-the-loop;
- UI semantics;
- model cards;
- quality/evidence;
- access/audit;
- Bank process policy.

## 16. Threat: privacy leakage through aggregate analytics

Даже aggregates требуют review, если малая группа позволяет обратную идентификацию.

Control:

- minimum group-size policy в production analytics;
- role-based access;
- no public row-level examples;
- review before exporting screenshots/reports.

## 17. Threat: stale/known infrastructure identifier

Publicly exposed hostname/IP should be treated as known to third parties even if removed later.

Controls:

- do not rely on obscurity;
- proper auth/firewall/TLS;
- replace endpoint when disclosure creates operational risk;
- never publish credentials alongside endpoint.

## 18. Security acceptance

Перед evaluator/on-prem snapshot проверить:

```text
[ ] no secrets/bank data in public tree
[ ] public hygiene CI green
[ ] runtime ports private
[ ] TLS/auth design documented
[ ] service tokens least-privilege
[ ] no mandatory external inference dependency
[ ] temporary audio lifecycle reviewed
[ ] logs reviewed for sensitive payload
[ ] dependency/SBOM scan prepared
[ ] model/version integrity recorded
[ ] rollback/incident procedure available
```

## 19. Out of scope of this public document

Здесь намеренно не публикуются:

- production firewall rules;
- actual hostnames/IPs;
- credential format/values;
- bank IAM configuration;
- internal network topology details beyond logical boundaries;
- vulnerability findings tied to a live endpoint.

## 20. Итог

On-prem безопасность достигается не отсутствием публичного source code, а совокупностью:

```text
minimal public surface
+ strong auth/network boundary
+ data minimization
+ fail-closed behavior
+ release integrity
+ secret/dependency governance
```