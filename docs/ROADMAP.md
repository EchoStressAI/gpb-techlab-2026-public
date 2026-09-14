# Public Roadmap

Этот roadmap описывает развитие **публичного integration layer**. Он не является полным внутренним research roadmap EchoStressAI.

## Этап 1 — Public integration foundation

Статус: **готово**.

- единый FastAPI service;
- CASE 1 / CASE 2 routing;
- horizons 60/180 sec;
- health/readiness;
- runtime gateway;
- fail-closed errors;
- Docker/Compose;
- CI;
- public repository policy.

## Этап 2 — Documentation & transparency

Статус: **в работе / основная документация добавлена**.

- архитектура;
- model cards;
- methodology;
- expert review protocol;
- validation protocol;
- API reference;
- deployment;
- explainability;
- responsible use;
- security/privacy;
- demo/acceptance guides.

## Этап 3 — Reference runtime adapters

Цель: добавить публично безопасные adapters, которые позволяют подключать реальные локальные CASE 1/CASE 2 runtime без раскрытия внутренней реализации.

План:

- reference sidecar wrapper;
- strict runtime schema;
- model identity;
- synthetic end-to-end tests;
- latency/error telemetry;
- safe quality fields.

## Этап 4 — End-to-end local compose

Цель: одной командой поднять integration API + reference runtime adapters в локальной сети.

```bash
docker compose up --build
```

Для real model inference закрытые serving artifacts предоставляются отдельно и не попадают в public Git.

## Этап 5 — UI/API alignment

- стабилизировать frontend-facing response schema;
- зафиксировать error states;
- quality badges;
- explanation blocks;
- model version display;
- predictable progress/status semantics.

## Этап 6 — Release evidence

Для каждой демонстрационной версии фиксировать:

- public commit SHA;
- API version;
- runtime model IDs;
- Docker image identity;
- CI run;
- smoke result;
- validation report reference.

## Этап 7 — On-prem hardening

Отдельный deployment layer:

- offline artifacts;
- enterprise authentication;
- TLS;
- network isolation;
- audit logging;
- SBOM;
- vulnerability scanning;
- rollback;
- observability.

## Вне scope public roadmap

Публичный roadmap намеренно не раскрывает:

- внутренние model experiments;
- exact feature/weight search;
- proprietary integral methodology;
- персональную норму и универсальные fusion rules;
- закрытые датасеты и expert labels;
- training pipeline.

## Definition of Done для public submission

Public submission считается технически собранным, когда:

1. CI зелёный;
2. docs соответствуют фактическому коду;
3. оба case runtime можно подключить локально через stable contract;
4. readiness различает integration health и model availability;
5. end-to-end demo работает на безопасном примере;
6. private data/IP не присутствуют в Git history текущего submission repo;
7. validation claims имеют model/protocol identity.
