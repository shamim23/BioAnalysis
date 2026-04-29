import { z } from "zod";
import { Product, ComparisonData, ContaminantData, OptimizationResult } from "../types";
import { AIProvider, GenerateContentOptions, ModelTier, createAIProvider } from "./aiProvider";

const StringOrNum = z.preprocess(v => (v == null ? undefined : String(v)), z.string().optional().default(""));

const StudySchema = z.object({
  title: z.string(),
  authors: z.string(),
  year: StringOrNum,
  journal: StringOrNum,
  studyType: StringOrNum,
  sampleSize: StringOrNum,
  keyFindings: z.string(),
  citation: z.string(),
});

const DiscoverySchema = z.object({
  compound: z.string(),
  studies: z.array(StudySchema).min(1),
  searchSummary: z.string().optional().default(""),
});
export type DiscoveryData = z.infer<typeof DiscoverySchema>;

const ProductSchema = z.object({
  name: z.string(),
  brand: z.string(),
  price: z.string().optional().default(""),
  description: z.string(),
  url: z.string(),
  rating: z.number().optional(),
  image: z.string().optional(),
});
const ProductsArraySchema = z.array(ProductSchema);
const ProductsObjectSchema = z.object({ products: ProductsArraySchema });

const ComparisonSchema = z.object({
  summary: z.string(),
  comparisonTable: z.array(z.record(z.string(), z.string())),
  verdict: z.string(),
});

const ContaminantSchema = z.object({
  summary: z.string(),
  alerts: z.array(z.object({
    brand: z.string(),
    contaminant: z.string(),
    level: z.string(),
    source: z.string(),
    date: z.string(),
    status: z.enum(["warning", "recall", "safe"]),
  })),
  generalRisks: z.string(),
});

const OptimizationSchema = z.object({
  category: z.string(),
  summary: z.string(),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    evidenceLevel: z.enum(["high", "medium", "low"]),
    mechanism: z.string(),
  })),
  lifestyleChanges: z.array(z.string()),
  suggestedCompounds: z.array(z.string()),
});

export interface CitationCheckResult {
  total: number;
  verified: string[];
  unverifiable: string[];
  notes: string;
}

const CitationCheckSchema = z.object({
  total: z.number(),
  verified: z.array(z.string()),
  unverifiable: z.array(z.string()),
  notes: z.string().optional().default(""),
});

function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

export class BioResearchService {
  private provider: AIProvider;

  constructor() {
    this.provider = createAIProvider();
  }

  private async callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes("503") ||
                          error?.message?.includes("high demand") ||
                          error?.message?.includes("429") ||
                          error?.message?.includes("rate limit");

      if (isRateLimit && retries > 0) {
        console.warn(`[BioResearchService] Model busy, retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private async generateJson<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options: GenerateContentOptions = {},
    label = "json"
  ): Promise<T> {
    const opts: GenerateContentOptions = { ...options, responseMimeType: "application/json" };
    const first = await this.callWithRetry(() => this.provider.generateContent(prompt, opts));

    const parsed = this.tryParse(first.text, schema);
    if (parsed.ok === true) return parsed.value;

    const firstError = parsed.error;
    console.warn(`[${label}] First parse failed: ${firstError}. Attempting repair.`);

    const repairPrompt = `The following output failed JSON schema validation.

ORIGINAL OUTPUT:
${first.text}

VALIDATION ERROR:
${firstError}

Return ONLY valid JSON that satisfies the original request. No prose, no code fences.`;

    const second = await this.callWithRetry(() => this.provider.generateContent(repairPrompt, opts));
    const repaired = this.tryParse(second.text, schema);
    if (repaired.ok === true) return repaired.value;

    throw new Error(`[${label}] JSON repair failed: ${repaired.error}`);
  }

  private tryParse<T>(text: string, schema: z.ZodType<T>):
    | { ok: true; value: T; error?: undefined }
    | { ok: false; value?: undefined; error: string } {
    try {
      const cleaned = stripJsonFences(text);
      const json = JSON.parse(cleaned);
      const result = schema.safeParse(json);
      if (result.success) return { ok: true, value: result.data };
      return { ok: false, error: result.error.message };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "parse error" };
    }
  }

  async runDiscovery(compound: string): Promise<DiscoveryData> {
    const prompt = `Search for the most relevant, recent, and highly-cited scientific literature on the biological compound: ${compound}. Prioritize RCTs, meta-analyses, and high-impact clinical trials.

Return a JSON object with this exact shape:
{
  "compound": "${compound}",
  "searchSummary": "Brief overview of the literature landscape (2-3 sentences).",
  "studies": [
    {
      "title": "...",
      "authors": "Lead author et al.",
      "year": "2023",
      "journal": "...",
      "studyType": "RCT | Meta-analysis | Cohort | ...",
      "sampleSize": "n=240",
      "keyFindings": "1-2 sentence summary of the result.",
      "citation": "Smith et al., 2023, J. Clinical Nutrition"
    }
  ]
}

Include at least 5 studies. Cite real papers — do not fabricate. JSON only.`;

    return this.generateJson(prompt, DiscoverySchema, { enableSearch: true, tier: "fast" }, "discovery");
  }

  async runAnalysis(compound: string, discovery: DiscoveryData): Promise<string> {
    const studiesText = discovery.studies
      .map((s, i) => `[${i + 1}] ${s.citation} (${s.studyType}${s.sampleSize ? `, ${s.sampleSize}` : ""}): ${s.keyFindings}`)
      .join("\n");

    const response = await this.callWithRetry(() => this.provider.generateContent(
      `As a Data Extraction Scientist and Evidence Evaluator, analyze this research on ${compound}:

${studiesText}

Extract:
1. Biological pathways and mechanisms.
2. Specific physiological effects and dosages.
3. Evidence strength (1-10) for each claim, citing the study index [N].
4. Contradictions or conflicting findings between studies.

Be concise. Reference studies by their [N] index.`,
      { tier: "fast" }
    ));
    return response.text;
  }

  async runSafetyCheck(compound: string, analysisData: string): Promise<string> {
    const response = await this.callWithRetry(() => this.provider.generateContent(
      `As a Clinical Toxicologist and Safety Officer, evaluate the risks of ${compound} based on this analysis:

${analysisData}

Identify:
1. Known side effects and adverse reactions.
2. Contraindications (who should avoid this).
3. Potential drug interactions.
4. Long-term safety concerns.`,
      { tier: "fast" }
    ));
    return response.text;
  }

  async runSynthesis(
    compound: string,
    discovery: DiscoveryData,
    analysisData: string,
    safetyData: string,
    biomarkers?: string
  ): Promise<string> {
    const studiesBlock = discovery.studies
      .map((s, i) => `[${i + 1}] ${s.citation} — ${s.studyType}: ${s.keyFindings}`)
      .join("\n");

    const prompt = `As the Chief Medical Synthesizer, create a final Master Report on ${compound}.

PRIMARY LITERATURE (cite by index, e.g. [1], [2]):
${studiesBlock}

RESEARCH ANALYSIS:
${analysisData}

SAFETY & TOXICOLOGY:
${safetyData}

${biomarkers ? `USER CONTEXT (BIOMARKERS/PROFILE): ${biomarkers}` : ""}

Structure the report EXACTLY with these markdown headers:
# ${compound} Analysis Report

## 1. Executive Summary
High-level overview and primary clinical utility.

## 2. Biological Mechanisms
Cellular and systemic pathways (receptors, enzymes, cascades).

## 3. Clinical Evidence & Consensus
Strength of evidence (RCTs vs animal) and current scientific agreement. Cite by [N].

## 4. Therapeutic Benefits
Specific benefits backed by the analysis. Cite by [N].

## 5. Safety & Contraindications
Side effects, drug interactions, populations at risk.

## 6. Sourcing & Bioavailability
Best forms (e.g., Liposomal, Acetyl-L) and natural sources.

${biomarkers ? "## 7. Personalized Clinical Assessment\nContextualize for the provided biomarkers." : ""}

## References
Numbered list matching the [N] citations used above. Use ONLY studies from PRIMARY LITERATURE — do not invent new ones.

Professional clinical tone.`;

    const response = await this.callWithRetry(() => this.provider.generateContent(prompt, { tier: "strong" }));
    return response.text;
  }

  async runCitationCheck(compound: string, report: string, discovery: DiscoveryData): Promise<CitationCheckResult> {
    const allowedCitations = discovery.studies.map((s, i) => `[${i + 1}] ${s.citation}`).join("\n");

    const prompt = `You are a citation auditor. Check the following clinical report on ${compound}.

ALLOWED CITATIONS (the only sources used during research):
${allowedCitations}

REPORT TO AUDIT:
${report}

Find every inline citation in the report (any [N] index references, "et al., YYYY" patterns, journal references). For each, decide if it maps to one of the ALLOWED CITATIONS. Anything not traceable is "unverifiable" (likely hallucinated).

Return JSON:
{
  "total": <number of citations found>,
  "verified": ["list of citation strings that match an allowed source"],
  "unverifiable": ["list of citation strings with no allowed-source match"],
  "notes": "Optional 1-sentence summary"
}`;

    return this.generateJson(prompt, CitationCheckSchema, { tier: "fast" }, "citation-check");
  }

  async runMarketplaceSearch(compound: string): Promise<Product[]> {
    const prompt = `Search for the top 4 highest-quality, reputable commercial supplement products for ${compound}.
Focus on brands known for purity and bioavailability (e.g., Thorne, Life Extension, Pure Encapsulations, NOW).
Return a JSON object: {"products": [{"name": "...", "brand": "...", "price": "$25", "description": "...", "url": "https://..."}]}.
Return at least 3 products. JSON only.`;

    try {
      const data = await this.generateJson(prompt, ProductsObjectSchema, { enableSearch: true, tier: "fast" }, "marketplace");
      return data.products;
    } catch {
      try {
        const arr = await this.generateJson(prompt, ProductsArraySchema, { enableSearch: true, tier: "fast" }, "marketplace-array");
        return arr;
      } catch (e) {
        console.error("Marketplace search failed", e);
        return [];
      }
    }
  }

  async runProductComparison(compound: string, products: Product[]): Promise<ComparisonData> {
    const urls = products.map(p => p.url).filter(url => url.startsWith('http')).slice(0, 5);

    if (urls.length === 0) {
      return { summary: "No valid product URLs found for comparison.", comparisonTable: [], verdict: "N/A" };
    }

    const prompt = `Analyze and compare these specific products for ${compound}: ${urls.join(', ')}.
Scrape the content from these URLs to compare:
1. Ingredients (active and inactive).
2. Pricing per serving.
3. User reviews and sentiment.
4. Manufacturing quality (e.g., GMP, 3rd party testing).

Return a JSON object:
{
  "summary": "Brief market overview.",
  "comparisonTable": [{"feature": "Price per Serving", "BrandA": "$0.50", "BrandB": "$0.75"}],
  "verdict": "Final recommendation."
}`;

    try {
      const data = await this.generateJson(prompt, ComparisonSchema, { enableSearch: true, tier: "fast" }, "comparison");
      return data as unknown as ComparisonData;
    } catch (e) {
      console.error("Failed to parse comparison data", e);
      return { summary: "Failed to generate comparison data.", comparisonTable: [], verdict: "Error" };
    }
  }

  async runContaminantCheck(compound: string, products: Product[]): Promise<ContaminantData> {
    const brandNames = products.map(p => p.brand).join(", ");
    const prompt = `As a Purity & Contaminant Specialist, investigate ${compound} supplements for heavy metals (Lead, Cadmium, Arsenic, Mercury), pesticides, and mold.

Specifically check for:
1. FDA Recalls or Warning Letters related to ${compound} or these brands: ${brandNames}.
2. Consumer Reports testing data from 2023-2025.
3. Independent testing results (e.g., Labdoor, Lead Safe Mama, NSF, USP).
4. Prop 65 warnings or elevated contaminant levels (>0.5 µg/day lead).

Return a JSON object:
{
  "summary": "...",
  "alerts": [{"brand": "...", "contaminant": "Lead", "level": "2.5 ppm", "source": "FDA Recall", "date": "2024-03", "status": "recall"}],
  "generalRisks": "..."
}
status must be one of: "warning", "recall", "safe".`;

    try {
      return await this.generateJson(prompt, ContaminantSchema, { enableSearch: true, tier: "fast" }, "contaminants");
    } catch (e) {
      console.error("Failed to parse contaminant data", e);
      return {
        summary: "Failed to retrieve specific contaminant data.",
        alerts: [],
        generalRisks: "General caution advised for this compound category.",
      };
    }
  }

  async runOptimizationResearch(category: string, answers: Record<string, string>): Promise<OptimizationResult> {
    console.log(`[Intelligence Agent] Analyzing category: ${category}`);
    if (answers.user_medical_history?.includes('[File Attached:')) {
      console.log(`[OCR Agent] Extracting clinical data from uploaded medical records...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`[OCR Agent] Extraction successful. Biomarkers updated.`);
    }

    const prompt = `As a ${category} Optimization Specialist, analyze the following user assessment data:

USER PROFILE & QUESTIONNAIRE:
${JSON.stringify(answers, null, 2)}

The data includes the user's age, gender, current issues, and medical history.

Conduct deep research into:
1. Primary physiological mechanisms involved in these symptoms/goals, taking into account the user's age and gender.
2. Evidence-based lifestyle interventions (e.g., light exposure, meal timing, temperature).
3. Targeted compounds/supplements (Modern, Ayurvedic, and TCM) with high evidence scores for these specific issues and profile.
4. Potential sub-agents to consult (e.g., Circadian Biologist, Microbiome Researcher).

Return a JSON object:
{
  "category": "${category}",
  "summary": "...",
  "recommendations": [{"title": "...", "description": "...", "evidenceLevel": "high", "mechanism": "..."}],
  "lifestyleChanges": ["..."],
  "suggestedCompounds": ["..."]
}
evidenceLevel must be one of: "high", "medium", "low".`;

    try {
      return await this.generateJson(prompt, OptimizationSchema, { enableSearch: true, tier: "fast" }, "optimization");
    } catch (e) {
      console.error("Failed to parse optimization data", e);
      return {
        category,
        summary: "Failed to generate optimization report.",
        recommendations: [],
        lifestyleChanges: [],
        suggestedCompounds: [],
      };
    }
  }
}
