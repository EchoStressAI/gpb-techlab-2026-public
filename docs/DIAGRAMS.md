# Диаграммы архитектуры и потоков

GitHub рендерит Mermaid-диаграммы прямо в Markdown. Этот файл даёт визуальную карту решения без раскрытия закрытой внутренней реализации model runtime.

## 1. Общая архитектура

```mermaid
flowchart LR
    U[User / UI] -->|audio + case_id| API[Public Integration API]
    API -->|CASE_1, 60 sec| C1[CASE 1 local runtime]
    API -->|CASE_2, 180 sec| C2[CASE 2 local runtime]
    C1 --> R1[score / quality / XAI]
    C2 --> R2[state signal / quality / XAI]
    R1 --> API
    R2 --> API
    API --> U

    classDef public fill:#eaf4ff,stroke:#2563eb,stroke-width:1px;
    classDef private fill:#fff7ed,stroke:#ea580c,stroke-width:1px;
    class API,U public;
    class C1,C2 private;
```

## 2. Public/private boundary

```mermaid
flowchart TB
    subgraph PUBLIC[Public Git repository]
      A[FastAPI]
      B[Case routing]
      C[Runtime contract]
      D[Docker / CI]
      E[Model Cards / Validation docs]
    end

    subgraph PRIVATE[Local / private serving layer]
      F[CASE 1 serving artifacts]
      G[CASE 2 serving artifacts]
      H[Private preprocessing]
      I[Compiled / protected implementation if required]
    end

    C --> F
    C --> G
    F --> H
    G --> H

    subgraph EXCLUDED[Not published]
      J[Bank audio / transcripts]
      K[Training notebooks]
      L[Universal proprietary integral methodology]
      M[Private datasets / feature tables]
    end
```

## 3. CASE 1 request sequence

```mermaid
sequenceDiagram
    participant UI as UI / Client
    participant API as Integration API
    participant R1 as CASE 1 Runtime

    UI->>API: POST /api/v1/analyze (CASE_1, audio)
    API->>API: validate upload + case_id
    API->>R1: POST /v1/analyze + horizon=60
    R1->>R1: case-specific inference <=60 sec
    R1-->>API: model_id + status + score + quality + XAI
    API->>API: validate case/horizon/required fields
    API-->>UI: unified result
```

## 4. CASE 2 request sequence

```mermaid
sequenceDiagram
    participant UI as UI / Client
    participant API as Integration API
    participant R2 as CASE 2 Runtime

    UI->>API: POST /api/v1/analyze (CASE_2, audio)
    API->>API: validate upload + case_id
    API->>R2: POST /v1/analyze + horizon=180
    R2->>R2: analyze relevant employee speech <=180 sec
    R2-->>API: model_id + status + state signal + quality + XAI
    API->>API: validate case/horizon/required fields
    API-->>UI: unified result
```

## 5. Health vs readiness

```mermaid
stateDiagram-v2
    [*] --> API_Start
    API_Start --> Health_OK: FastAPI process is alive
    Health_OK --> Not_Ready: one or more runtimes unavailable
    Health_OK --> Ready: both runtimes report status=ok
    Not_Ready --> Ready: runtimes become available
    Ready --> Not_Ready: runtime outage / health failure
```

## 6. Error semantics

```mermaid
flowchart TD
    Q[Analyze request] --> V{Input valid?}
    V -- no --> E400[HTTP 400 / 413]
    V -- yes --> R{Runtime reachable?}
    R -- no --> E503[HTTP 503 MODEL_RUNTIME_UNAVAILABLE]
    R -- yes --> C{Runtime contract valid?}
    C -- no --> E502[HTTP 502 MODEL_RUNTIME_CONTRACT_ERROR]
    C -- yes --> M{Evidence sufficient?}
    M -- yes --> OK[200 model result + quality]
    M -- limited --> LIM[200 result + limited/insufficient quality]

    E503 -.-> N[No fallback score]
    E502 -.-> N
```

## 7. Quality is not prediction

```mermaid
flowchart LR
    AUDIO[Audio] --> MODEL[Model inference]
    AUDIO --> QUALITY[Evidence / quality assessment]
    MODEL --> SCORE[Model signal]
    QUALITY --> QSTATE[Quality state]
    SCORE --> VIEW[UI interpretation]
    QSTATE --> VIEW
    VIEW --> HUMAN[Human-in-the-loop decision]
```

## 8. Validation layers

```mermaid
flowchart TB
    T[Unit / contract tests] -->|checks| I[Integration correctness]
    P[Serving parity / runtime smoke] -->|checks| S[Serving correctness]
    V[Validation protocol] -->|checks| M[ML performance]
    E[Expert review] -->|checks| C[Construct / interpretation limits]
    Q[Quality analysis] -->|checks| R[Evidence reliability]

    I --> RELEASE[Release evidence]
    S --> RELEASE
    M --> RELEASE
    C --> RELEASE
    R --> RELEASE
```

## 9. Demo flow

```mermaid
flowchart LR
    A[Upload file] --> B[Select CASE 1 / CASE 2]
    B --> C[Fixed 60 / 180 sec horizon]
    C --> D[Local runtime]
    D --> E[Score / signal]
    D --> F[Quality]
    D --> G[Explanation]
    E --> H[Unified UI card]
    F --> H
    G --> H
    H --> I[Next step / human review]
```

## 10. Public release lifecycle

```mermaid
flowchart LR
    BR[Feature branch] --> PR[Pull Request]
    PR --> CI[Public CI]
    CI -->|green| MERGE[Merge to main]
    CI -->|fail| FIX[Fix branch]
    FIX --> CI
    MERGE --> SMOKE[Integration smoke]
    SMOKE --> DEMO[Versioned demo / release evidence]
```

Диаграммы показывают публичную архитектуру. Они намеренно не изображают внутренние proprietary formulas, private datasets или model-training pipeline.
