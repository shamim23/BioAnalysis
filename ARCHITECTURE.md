# Bio-Compound Analyzer — System Architecture & Data Model

## 1. Current Architecture (v1.0.5 — Frontend-only)

```
┌────────────────────────────────────────────────────────────────┐
│                         Browser (Vite/React)                   │
│                                                                │
│   ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│   │   App.tsx    │───►│  Mode Router    │───►│   7 Modes    │  │
│   │  (state hub) │    │ (research/atlas │    │ (UI surfaces)│  │
│   └──────┬───────┘    │  /toxin/...)    │    └──────────────┘  │
│          │            └─────────────────┘                      │
│          ▼                                                     │
│   ┌──────────────────┐    ┌─────────────────────────────────┐  │
│   │ BioResearchSvc   │───►│  AIProvider (Gemini | OpenAI)   │  │
│   │ - Prompts        │    │  - fast-tier  (extraction)      │  │
│   │ - zod schemas    │    │  - strong-tier (synthesis)      │  │
│   │ - parse-retry    │    └────────────┬────────────────────┘  │
│   └──────────────────┘                 │                       │
│                                        │                       │
│   ┌──────────────────┐                 │ HTTPS (API key in JS) │
│   │ State (in-memory)│                 │  ⚠ dangerouslyAllow   │
│   │ - report         │                 │       Browser         │
│   │ - history[]      │                 ▼                       │
│   │ - userProfile    │      ┌────────────────────┐             │
│   └──────────────────┘      │  Gemini / OpenAI   │             │
│                             │     (external)     │             │
└─────────────────────────────└────────────────────┘─────────────┘
```

### Components

| Layer | Files | Responsibility |
|---|---|---|
| **Entry** | `src/main.tsx`, `src/App.tsx` | App bootstrap, mode routing, Research pipeline orchestration |
| **Modes (UI)** | `src/components/*.tsx` | One file per top-level surface (Research/Optimization/Graph/Atlas/Pro/Diagnostics/Toxin) |
| **Service** | `src/services/bioResearchService.ts` | All LLM-facing prompts + zod validation + repair retry |
| **Provider** | `src/services/aiProvider.ts` | Vendor-neutral AI interface; tier selection; key loading from `process.env` |
| **Types** | `src/types.ts` | All cross-component data contracts |
| **Static data** | inline constants in component files | Knowledge Graph nodes, Atlas systems, Diagnostic tests, Toxin catalog |

### Pipeline (Research Engine)

```
   Discovery (search, JSON, fast-tier)
        │
        ├── Chain A: Analysis ─► Safety
        │
        └── Chain B: Marketplace ─► (Comparison ‖ Purity)
                                ▼
                         Synthesis (strong-tier)
                                ▼
                         Citation Audit
```

Two chains run in parallel via `Promise.all` (`App.tsx:91+`). Comparison and Purity are also parallel inside Chain B.

### Limits of the current design

- **API keys ship in the bundle** (`dangerouslyAllowBrowser: true`). Anyone can extract them. Blocks public deploy.
- **No persistence**. Refresh wipes report history, user profile, optimization results.
- **No telemetry**. No way to measure cost/latency/parse-failure rates.
- **No multi-user / auth**. Each browser is an island.
- **Static catalogs in TSX files**. Atlas/Toxin/Diagnostic data requires a code change + redeploy to update.
- **No caching**. Re-querying the same compound burns tokens.
- **CORS-bound**. Can't proxy other APIs (PubMed, FDA OpenFDA) without a backend.

---

## 2. Data Model

All types live in `src/types.ts` plus zod schemas in `src/services/bioResearchService.ts`.

### Core entities

```ts
// Pipeline observability — one per agent in AGENTS_CONFIG
AgentStatus {
  id: string                                   // 'discovery' | 'analysis' | ...
  name: string
  role: string
  status: 'idle' | 'running' | 'completed' | 'error'
  output?: string
}

// Discovery output — structured JSON, indexed for citation
DiscoveryData {
  compound: string
  searchSummary: string
  studies: Study[]
}

Study {
  title: string
  authors: string
  year: string
  journal: string
  studyType: string                            // 'RCT' | 'Meta-analysis' | ...
  sampleSize: string
  keyFindings: string
  citation: string                             // 'Smith et al., 2023, J. Clin. Nutr.'
}

// Marketplace
Product {
  name: string
  brand: string
  price?: string
  rating?: number
  description: string
  url: string
  image?: string
}

ComparisonData {
  summary: string
  comparisonTable: { feature: string; [brand: string]: string }[]
  verdict: string
}

// Purity
ContaminantData {
  summary: string
  alerts: ContaminantAlert[]
  generalRisks: string
}

ContaminantAlert {
  brand: string
  contaminant: string
  level: string                                // '2.5 ppm'
  source: string                               // 'FDA Recall'
  date: string
  status: 'warning' | 'recall' | 'safe'
}

// Optimization Hub
OptimizationResult {
  category: 'Sleep' | 'Digestion' | ...
  summary: string
  recommendations: Recommendation[]
  lifestyleChanges: string[]
  suggestedCompounds: string[]
}

Recommendation {
  title: string
  description: string
  evidenceLevel: 'high' | 'medium' | 'low'
  mechanism: string
}

// Citation auditor output
CitationAudit {
  total: number
  verified: string[]
  unverifiable: string[]
  notes: string
}

// Aggregate report (one per Research Engine run)
ResearchReport {
  compound: string
  biomarkers?: string
  timestamp: string                            // ISO
  content: string                              // markdown synthesis
  products?: Product[]
  comparison?: ComparisonData
  purity?: ContaminantData
  optimization?: OptimizationResult
  citations?: CitationAudit
}
```

### Static catalogs (compile-time data)

| Catalog | Location | Shape |
|---|---|---|
| Organ systems & relationships | `KnowledgeGraph.tsx` `DATA` | `{ nodes: Node[], links: Link[] }` |
| Compounds by system | `BiologicalAtlas.tsx` `SYSTEMS` | `OrganSystem[]` (tagged modern/ayurvedic/tcm) |
| Lab tests | `DiagnosticLab.tsx` `DIAGNOSTIC_DATA` | `DiagnosticSystem[]` with `LabTest[]` per system |
| Toxins | `ToxinRadar.tsx` `TOXIN_DATA` | `Toxin[]` with `recentStudies` |
| Pro Dashboard mocks | `ProfessionalDashboard.tsx` | All hardcoded; placeholders for real data |

### State stores

| State | Owner | Lifetime |
|---|---|---|
| `report`, `history` | `App.tsx` (`useState`) | session (lost on refresh) |
| `userProfile`, `results` (optimization) | `OptimizationHub.tsx` | session |
| `selectedNode`, `hoveredLink` | `KnowledgeGraph.tsx` | session |
| API keys | `process.env` (Vite injects at build) | per build |

---

## 3. Planned Migration: FastAPI Backend

We're moving the AI orchestration and data layer to a **FastAPI** service. The React app becomes a thin client.

### Target architecture

```
┌────────────────────────────┐         ┌─────────────────────────────────────┐
│     Browser (React)        │  HTTPS  │       FastAPI Backend (Python)      │
│                            │ ──────► │                                     │
│  - UI / state              │         │  ┌─────────────────────────────┐    │
│  - SSE streaming consumer  │         │  │  /api/research (POST, SSE)  │    │
│  - Auth tokens             │         │  │  /api/optimize (POST)       │    │
│  - No API keys             │         │  │  /api/toxins  (GET)         │    │
└────────────────────────────┘         │  │  /api/atlas   (GET)         │    │
                                       │  │  /api/labs    (GET, POST)   │    │
                                       │  │  /api/reports (GET, list)   │    │
                                       │  │  /auth/*                    │    │
                                       │  └─────────────┬───────────────┘    │
                                       │                │                    │
                                       │  ┌─────────────▼─────────────┐      │
                                       │  │   Pipeline orchestrator   │      │
                                       │  │   (asyncio + httpx)       │      │
                                       │  │   - parallel chains       │      │
                                       │  │   - prompt cache          │      │
                                       │  │   - retry/timeout         │      │
                                       │  └──┬───────────┬────────────┘      │
                                       │     │           │                   │
                                       │     ▼           ▼                   │
                                       │  ┌──────┐  ┌──────────────┐         │
                                       │  │ LLM  │  │   PubMed,    │         │
                                       │  │ APIs │  │   OpenFDA    │         │
                                       │  └──────┘  └──────────────┘         │
                                       │                                     │
                                       │  ┌─────────────────────────────┐    │
                                       │  │   Postgres + pgvector       │    │
                                       │  │   - users, reports, audits  │    │
                                       │  │   - cached studies          │    │
                                       │  │   - embedded study corpus   │    │
                                       │  └─────────────────────────────┘    │
                                       │                                     │
                                       │  ┌─────────────────────────────┐    │
                                       │  │   Redis (cache + queue)     │    │
                                       │  └─────────────────────────────┘    │
                                       └─────────────────────────────────────┘
```

### Why FastAPI

- **Async-first**: matches our parallel-chain pipeline naturally with `asyncio.gather`.
- **Pydantic schemas**: drop-in replacement for our zod schemas; auto-generates OpenAPI for the React client.
- **Python ecosystem**: native PubMed (`biopython`), OpenFDA, RDKit (chemistry), and Anthropic/Google/OpenAI SDKs.
- **Streaming**: SSE/WebSocket support is first-class — required for streaming the synthesis stage.

### Migration phases

| Phase | Scope | Deliverable |
|---|---|---|
| 0 | Spike | FastAPI app with one `/api/research` endpoint mirroring current pipeline. React calls it for research only; everything else stays browser-side. |
| 1 | Auth + persistence | Postgres + JWT auth. `ResearchReport` history persists per user. User profile (OptimizationHub) persists. |
| 2 | Move all LLM calls | Optimization Hub, citation audit, marketplace. Strip `dangerouslyAllowBrowser`. Remove keys from frontend bundle. |
| 3 | Real data sources | Replace Google search grounding with PubMed E-utils. Wire OpenFDA for purity recalls. Add OCR via Gemini File API. |
| 4 | Caching + cost control | Redis-cached discovery results (TTL 7d). Token accounting in DB. Per-user usage quotas. |
| 5 | Static data → DB | Migrate Atlas/Toxin/Diagnostic catalogs to Postgres tables editable via admin UI. |
| 6 | Async jobs | Long synthesis runs via Celery/RQ; SSE for progress. Allows runs >30s without proxy timeouts. |

### Pydantic ↔ TypeScript contract

Each TypeScript interface in `src/types.ts` gets a Pydantic mirror:

```python
class Study(BaseModel):
    title: str
    authors: str
    year: str
    journal: str
    study_type: str
    sample_size: str
    key_findings: str
    citation: str

class DiscoveryData(BaseModel):
    compound: str
    search_summary: str
    studies: list[Study]

class ResearchReport(BaseModel):
    id: UUID
    user_id: UUID
    compound: str
    biomarkers: str | None = None
    timestamp: datetime
    content: str
    products: list[Product] | None = None
    comparison: ComparisonData | None = None
    purity: ContaminantData | None = None
    citations: CitationAudit | None = None
```

OpenAPI schema is generated from these and consumed by `openapi-typescript` to produce `src/types.generated.ts` — single source of truth, no drift.

### Database schema (initial)

```sql
users (id, email, hashed_password, profile_jsonb, created_at)
research_reports (id, user_id, compound, biomarkers, content, products, comparison, purity, citations, timestamp)
discovery_cache (compound_normalized PK, studies_jsonb, fetched_at)
toxins (id, name, category, sources, bio_impact, longevity_impact, risk_level, recent_studies_jsonb)
atlas_systems (id, name, description, hormones)
atlas_compounds (id, system_id FK, name, type, benefit)
diagnostic_systems (id, name, overview)
lab_tests (id, system_id FK, name, optimal_range, standard_range, significance, priority)
audit_log (id, user_id, action, payload_jsonb, latency_ms, tokens_used, created_at)
```

### What stays browser-side

- All UI state (mode, selected node, form inputs).
- D3 visualization (KnowledgeGraph) — server returns the graph data, browser renders.
- Markdown rendering of reports.

### What moves server-side

- Every LLM call.
- All API keys / secrets.
- All persistence.
- PubMed / OpenFDA fetches (CORS-blocked from browser anyway).
- OCR for lab PDFs.
- Citation audit.
