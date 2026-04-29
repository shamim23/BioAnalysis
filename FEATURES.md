# Bio-Compound Analyzer — Features & Improvement Roadmap

A walkthrough of every surface in the app, how it works under the hood, and where the highest-leverage improvements live.

---

## Architecture at a Glance

- **Frontend-only React (Vite + TS)**: no backend. The browser calls Gemini / OpenAI directly via `dangerouslyAllowBrowser: true` (`src/services/aiProvider.ts`).
- **Single AI abstraction** (`AIProvider`) swaps Gemini ↔ OpenAI, with two model tiers: `fast` (extraction) and `strong` (synthesis).
- **One service class** (`BioResearchService`) holds all prompts. Every JSON response is validated by zod with a one-shot repair retry.
- **Seven top-level "modes"** in `App.tsx` (`research | optimization | graph | atlas | professional | diagnostics | toxin`).

---

## 1. Research Engine (`mode: 'research'`)

**Entry**: `App.tsx:81` `handleResearch`.

The headline feature. User enters a compound (+ optional biomarker context) and gets a "Master Report" plus product/purity panels.

**Pipeline** (after recent refactor):

```
Discovery (search-grounded JSON of studies)
   │
   ├──► [Analysis ──► Safety]                  (Chain A)
   │
   └──► [Marketplace ──► (Comparison ‖ Purity)] (Chain B)
              │
              ▼
         Synthesis (strong-tier model)
              │
              ▼
         Citation Audit
```

- Chains A and B run in parallel.
- Comparison and Purity also run in parallel after Marketplace.
- Discovery returns a structured `studies[]` array; analysis and synthesis cite them by `[N]` index.
- After synthesis, a **citation auditor** scans the report for inline cites and flags any not traceable to the discovery list — defends against hallucinated references (critical for a clinical tool).

**UI**: live "agent" status panel (`AGENTS_CONFIG`), tabs for Report / Marketplace / Comparison / Purity, history list of past compounds.

### Improvements
- **Render the citation audit** in the UI — currently stored on `ResearchReport.citations` but not displayed. A simple badge ("12/14 citations verified") + collapsible list of unverifiable cites would make hallucinations visible to the user.
- **Stream the synthesis**. It's the slowest step on `tier: "strong"`. Use SSE/streaming so the markdown appears progressively instead of staring at a spinner.
- **Cache discovery output** by compound name in `localStorage` with a TTL. Re-querying the same compound currently re-burns tokens.
- **PubMed grounding**: replace generic Google search with PubMed E-utilities (free) for discovery. Higher-quality sources, real DOIs, fewer hallucinations.
- **Per-stage timeouts**. A stuck Gemini 503 in one chain blocks `Promise.all`. Add `Promise.race` with timeouts and graceful fallbacks.
- **Token accounting**. No visibility into cost per report. Surface total tokens / latency in the agent panel.
- **Move secrets server-side**. `dangerouslyAllowBrowser: true` exposes API keys in the bundle. A 50-line Express proxy (already in `node_modules`) would fix this for production.

---

## 2. Optimization Hub (`mode: 'optimization'`)

**File**: `src/components/OptimizationHub.tsx`.

Goal-oriented workflow: pick **Sleep** or **Digestion**, fill in a profile (age/gender/issues/medical history) plus a category questionnaire, get an `OptimizationResult` (recommendations, lifestyle changes, suggested compounds). Each suggested compound has a "Deep Dive" button that re-triggers the Research Engine.

**Under the hood**: single call to `BioResearchService.runOptimizationResearch(category, answers)` with search grounding. Returns zod-validated JSON.

There's an **OCR Agent placeholder** (`bioResearchService.ts:312-316`) that *simulates* extracting biomarkers from an uploaded medical history file with `setTimeout(1500)`. It does nothing real.

### Improvements
- **Make the OCR real or remove it.** Currently it's theatrical UI — files attach but nothing extracts. Either wire up Gemini's vision/file API to read the PDF, or strip the upload surface.
- **Expand beyond Sleep/Digestion**. The two hardcoded categories cap the feature's value. Cognition, Metabolism, Stress, Hormones are obvious extensions.
- **Persist user profile** in `localStorage` so it auto-fills across sessions.
- **Cross-link with Diagnostic Lab**. When recommendations imply a biomarker (e.g., "low DHEA"), link to the matching DiagnosticLab test.

---

## 3. Knowledge Graph (`mode: 'graph'`)

**File**: `src/components/KnowledgeGraph.tsx`.

D3 force-directed graph of 10 organ systems with weighted edges showing biological relationships (e.g., "Gut-Brain Axis: 95% of Serotonin produced in gut"). Click a node to see its description; click "Jump to Atlas" to see its compounds.

**Under the hood**: pure D3 + static `DATA` constant (`KnowledgeGraph.tsx:22-53`). No AI. Fully client-side.

### Improvements
- **Make it dynamic**. Right now this is a 16-edge static graph. The interesting version queries: "given a compound the user just researched, highlight the systems it affects." Wire `report.content` → graph node highlighting.
- **Edge evidence levels**. Each link has a `value` (1-4) but no source. Add a citation per edge so users can trace claims.
- **Search/filter**. No way to find a node by typing — useful as the graph grows.
- **Persist user-selected nodes** as a "saved view" in history.

---

## 4. Biological Atlas (`mode: 'atlas'`)

**File**: `src/components/BiologicalAtlas.tsx`.

Catalog of organ systems → compounds (Modern / Ayurvedic / TCM tagged) and key hormones. Browse-and-discover surface.

**Under the hood**: static `SYSTEMS` array (`BiologicalAtlas.tsx:37`). No AI.

### Improvements
- **Make compound entries clickable** → trigger the Research Engine. Currently they're informational dead ends. The "Deep Dive" pattern from OptimizationHub belongs here too.
- **Compound-to-system reverse lookup**. Search "Ashwagandha" and see every system it touches. Right now you can only browse system-first.
- **Pull from a live source**. The hardcoded list will rot. A small JSON file or CMS would let it grow without code edits.
- **Evidence tiers**. TCM/Ayurvedic claims need clearer evidence-strength signals — "traditional use" vs "RCT-supported".

---

## 5. Professional Dashboard (`mode: 'professional'`)

**File**: `src/components/ProfessionalDashboard.tsx`.

Persona view for "longevity researcher / health coach": cohorts, biomarker trends, research feed, protocol builder. Recharts line/bar visualizations.

**Under the hood**: 100% mock data (`COHORTS`, `BIOMARKER_TRENDS`, `RESEARCH_FEED`, `PROTOCOLS`, `STATS` constants at the top of the file). No persistence, no AI, no real client management.

### Improvements
- **It's a demo, not a product.** Decide: is this a marketing surface or a real feature? If real, it needs auth, a backend, and a data model for cohorts/clients.
- **If demo-only, label it as such** so users don't confuse it with working functionality.
- **Wire the Research Feed to the Research Engine**. Each feed item could deep-link to a compound report.
- **Protocol Builder is the most valuable real feature here** — let coaches assemble a sequence of recommendations from prior research reports and export them as a PDF for clients.

---

## 6. Diagnostic Lab (`mode: 'diagnostics'`)

**File**: `src/components/DiagnosticLab.tsx`.

Reference panel of biomarkers grouped by system (Adrenal, Endocrine, Respiratory…) with optimal vs standard ranges and clinical significance.

**Under the hood**: static `DIAGNOSTIC_DATA` constant. No AI.

### Improvements
- **Let users input their own labs.** The biggest miss — this is a passive reference today. Adding "paste your lab results" → highlight which markers are out of optimal range → cross-reference compounds (Atlas) and protocols (Optimization Hub) would tie the whole app together.
- **OCR lab PDFs** (and reuse the same pipeline that's stubbed in OptimizationHub).
- **Cite the optimal ranges**. "Optimal" ranges are opinionated and source-dependent (functional medicine vs conventional). Show the source.
- **Add panels for HRV, sleep markers, glucose** — the metrics users actually track on Oura/Whoop/CGMs.

---

## 7. Toxin Radar (`mode: 'toxin'`)

**File**: `src/components/ToxinRadar.tsx`.

Catalog of environmental hazards (PFAS, microplastics, BPA, glyphosate, VOCs, heavy metals) framed through a **longevity-impact** lens. Each card shows category, sources, biological impact, longevity impact, risk level (`critical | high | moderate`), and recent supporting studies. Clicking a card opens a full threat-profile overlay with a **"Run Deep Scientific Analysis"** button that calls the Research Engine (`onDeepDive={triggerResearch}`) — making this the only static-content surface that hands off to the AI pipeline by default.

**Under the hood**: static `TOXIN_DATA` constant (`ToxinRadar.tsx:30`), plus client-side text search across name + sources. No AI in the component itself; it acts as a curated entry point into the Research Engine.

**Why it matters**: ties the "exposome" framing (introduced in the page's red-banner intro) to the rest of the app. A user who reads about PFAS can immediately get a full evidence-graded clinical report on it, including any FDA recalls and mitigation options that surface from the Purity / Marketplace agents.

### Improvements
- **Make the database dynamic.** Six toxins is a starter set; the exposome catalog is far larger (parabens, phthalates, perchlorates, mycotoxins, EMF). Move to JSON/CMS so non-engineers can grow it.
- **Source-level mitigation guidance.** Each toxin lists exposure sources but no actionables. A "Reduce Exposure" panel (filter pitchers for PFAS, glass storage for BPA, organic for glyphosate) would close the loop from awareness → action.
- **Cross-link to Diagnostic Lab.** Many toxins have biomarker proxies (urinary BPA, hair/blood lead, glyphosate via urine). Wire each toxin to its corresponding lab test for users who want to measure exposure.
- **Cross-link to Biological Atlas.** Each toxin damages specific systems — link to those Atlas entries so users see the protective compounds (e.g., heavy metals → liver Atlas → NAC, milk thistle).
- **Risk personalization.** Risk level is currently global. With user profile (from OptimizationHub) — pregnant, immunocompromised, athlete with high water intake — the displayed risk should adjust.
- **Citation links.** `recentStudies` lists titles/journals/years but no DOIs or URLs. Add real source links so credibility check is one click away.
- **Exposure score.** Ask the user 5 quick lifestyle questions ("plastic water bottles?", "non-stick cookware?", "city tap water?") and produce a personalized cumulative-exposure score with a top-3 mitigation list.
- **Toxin-aware synthesis prompt.** When the AI report comes back from a toxin trigger, the synthesis prompt has no signal that the input is a *hazard* (not a supplement). The Research Engine should detect toxin inputs and switch to a "biomonitoring & detox" report template instead of a "therapeutic benefits" one.

---

## Cross-Cutting Improvements

These would lift quality across every feature:

### Reliability
- **Per-stage timeouts** with `Promise.race`.
- **Telemetry**: log token counts, latency, cache hits, parse failures. Send to a lightweight backend or even just `console.table` in dev.
- **Error boundaries** around each mode so one component's failure doesn't blank the page.

### Quality of AI Output
- **Prompt caching** — synthesis re-includes the full discovery + analysis + safety blob. Anthropic / Gemini both support cache breakpoints. Cuts cost ~40% on subsequent runs.
- **Few-shot examples** in JSON-output prompts. Currently zero-shot; one good example per schema would dramatically reduce parse failures.
- **Stage-specific evals**. Build a fixture of 10 known compounds with expected output ranges. Run before any prompt change.

### Architecture
- **Backend proxy** for API keys (mandatory before any public deploy).
- **Persistence layer**: history is in-memory only; refresh wipes it. `localStorage` for free, IndexedDB for richer query.
- **Code-split bundles**. Build warns at 1.4MB. Lazy-load non-research modes.
- **Replace static data files** (KnowledgeGraph, BiologicalAtlas, DiagnosticLab) with a single `data/` directory of JSON/MDX so content can grow without TSX edits.

### UX
- **Compare two compounds side-by-side** — currently each report stands alone.
- **Export reports as PDF** (especially valuable for the Pro Dashboard persona).
- **Dark mode** — beige theme is striking but tiring for long reading sessions.

### Highest-leverage three (if forced to pick)
1. **Real OCR + lab-input pipeline** wiring DiagnosticLab ↔ OptimizationHub ↔ Research Engine. Apply the same hand-off pattern Toxin Radar already uses.
2. **Backend proxy + persistence**. Required for any non-demo deployment.
3. **Citation audit UI + PubMed grounding + toxin-aware report templates**. The synthesis prompt should branch on whether the input is a therapeutic compound vs an environmental hazard.

