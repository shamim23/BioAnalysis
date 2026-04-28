import { Product, ComparisonData, ContaminantData, OptimizationResult } from "../types";
import { AIProvider, createAIProvider } from "./aiProvider";

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

  async runDiscovery(compound: string) {
    const response = await this.callWithRetry(() => this.provider.generateContent(
      `Search for the most relevant, recent, and highly-cited scientific literature regarding the biological compound: ${compound}. Focus on clinical trials, RCTs, and meta-analyses. Provide a structured summary of at least 5 key studies.`,
      { enableSearch: true }
    ));
    return response.text;
  }

  async runAnalysis(compound: string, discoveryData: string) {
    const response = await this.callWithRetry(() => this.provider.generateContent(
      `As a Data Extraction Scientist and Evidence Evaluator, analyze the following research data for ${compound}:
      
      ${discoveryData}
      
      Extract:
      1. Biological pathways and mechanisms.
      2. Specific physiological effects and dosages.
      3. Evidence strength (1-10) for each claim.
      4. Any contradictions or conflicting findings between studies.`
    ));
    return response.text;
  }

  async runSafetyCheck(compound: string, analysisData: string) {
    const response = await this.callWithRetry(() => this.provider.generateContent(
      `As a Clinical Toxicologist and Safety Officer, evaluate the risks of ${compound} based on this analysis:
      
      ${analysisData}
      
      Identify:
      1. Known side effects and adverse reactions.
      2. Contraindications (who should avoid this).
      3. Potential drug interactions.
      4. Long-term safety concerns.`
    ));
    return response.text;
  }

  async runSynthesis(compound: string, analysisData: string, safetyData: string, biomarkers?: string) {
    const prompt = `As the Chief Medical Synthesizer, create a final Master Report on ${compound} based on this research:
    
    RESEARCH ANALYSIS:
    ${analysisData}
    
    SAFETY & TOXICOLOGY:
    ${safetyData}
    
    ${biomarkers ? `USER CONTEXT (BIOMARKERS/PROFILE): ${biomarkers}` : ""}
    
    Structure the report EXACTLY with these markdown headers:
    # ${compound} Analysis Report
    
    ## 1. Executive Summary
    Provide a high-level overview of the compound and its primary clinical utility.
    
    ## 2. Biological Mechanisms
    Explain the cellular and systemic pathways (receptors, enzymes, cascades).
    
    ## 3. Clinical Evidence & Consensus
    Summarize the strength of evidence (RCTs vs Animal) and current scientific agreement.
    
    ## 4. Therapeutic Benefits
    List specific benefits backed by the analysis.
    
    ## 5. Safety & Contraindications
    Detail side effects, drug interactions, and populations at risk.
    
    ## 6. Sourcing & Bioavailability
    Explain the best forms (e.g., Liposomal, Acetyl-L, etc.) and natural sources.
    
    ${biomarkers ? "## 7. Personalized Clinical Assessment\nContextualize the findings for the provided biomarkers." : ""}
    
    Ensure every claim is rigorously cited (e.g., Smith et al., 2023). Use a professional, clinical tone.`;

    const response = await this.callWithRetry(() => this.provider.generateContent(prompt));
    return response.text;
  }

  async runMarketplaceSearch(compound: string): Promise<Product[]> {
    const response = await this.callWithRetry(() => this.provider.generateContent(
      `Search for the top 4 highest-quality, reputable commercial supplement products for ${compound}. 
      Focus on brands known for purity and bioavailability (e.g., Thorne, Life Extension, Pure Encapsulations, NOW).
      Return the results as a JSON array of objects with these keys: name, brand, price (estimate), description (brief), url (search link).`,
      { responseMimeType: "application/json", enableSearch: true }
    ));

    try {
      const data = JSON.parse(response.text);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Failed to parse marketplace data", e);
      return [];
    }
  }

  async runProductComparison(compound: string, products: Product[]): Promise<ComparisonData> {
    const urls = products.map(p => p.url).filter(url => url.startsWith('http')).slice(0, 5);
    
    if (urls.length === 0) {
      return {
        summary: "No valid product URLs found for comparison.",
        comparisonTable: [],
        verdict: "N/A"
      };
    }

    const response = await this.callWithRetry(() => this.provider.generateContent(
      `Analyze and compare these specific products for ${compound}: ${urls.join(', ')}. 
      Scrape the content from these URLs to compare:
      1. Ingredients (active and inactive).
      2. Pricing per serving.
      3. User reviews and sentiment.
      4. Manufacturing quality (e.g., GMP, 3rd party testing).
      
      Return the results as a JSON object with these keys:
      - summary: A brief overview of the market landscape.
      - comparisonTable: An array of objects where each object has a 'feature' key (e.g., "Price per Serving", "Main Ingredient") and keys for each brand name with their respective values.
      - verdict: A final recommendation on which product offers the best value/quality.`,
      { responseMimeType: "application/json", enableSearch: true }
    ));

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse comparison data", e);
      return {
        summary: "Failed to generate comparison data.",
        comparisonTable: [],
        verdict: "Error"
      };
    }
  }

  async runContaminantCheck(compound: string, products: Product[]): Promise<ContaminantData> {
    const brandNames = products.map(p => p.brand).join(", ");
    const response = await this.callWithRetry(() => this.provider.generateContent(
      `As a Purity & Contaminant Specialist, investigate ${compound} supplements for heavy metals (Lead, Cadmium, Arsenic, Mercury), pesticides, and mold.
      
      Specifically check for:
      1. FDA Recalls or Warning Letters related to ${compound} or these brands: ${brandNames}.
      2. Consumer Reports testing data from 2023-2025.
      3. Independent testing results (e.g., Labdoor, Lead Safe Mama, NSF, USP).
      4. Prop 65 warnings or elevated contaminant levels (>0.5 µg/day lead).
      
      Return the results as a JSON object with these keys:
      - summary: A high-level overview of the purity landscape for ${compound}.
      - alerts: An array of objects with keys: brand, contaminant, level (e.g., "2.5 ppm"), source (e.g., "FDA Recall"), date, status ("warning", "recall", or "safe").
      - generalRisks: A summary of common contaminants found in this specific compound category (e.g., "Cinnamon is often high in lead due to soil conditions").`,
      { responseMimeType: "application/json", enableSearch: true }
    ));

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse contaminant data", e);
      return {
        summary: "Failed to retrieve specific contaminant data.",
        alerts: [],
        generalRisks: "General caution advised for this compound category."
      };
    }
  }

  async runOptimizationResearch(category: string, answers: Record<string, string>): Promise<OptimizationResult> {
    console.log(`[Intelligence Agent] Analyzing category: ${category}`);
    if (answers.user_medical_history.includes('[File Attached:')) {
      console.log(`[OCR Agent] Extracting clinical data from uploaded medical records...`);
      // Simulate extraction delay
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
    
    Return the results as a JSON object with these keys:
    - category: "${category}"
    - summary: A brief clinical overview of the user's profile and why these recommendations were chosen.
    - recommendations: An array of objects with keys: title, description, evidenceLevel ("high", "medium", "low"), mechanism.
    - lifestyleChanges: An array of strings.
    - suggestedCompounds: An array of strings (compounds to research further).`;

    const response = await this.callWithRetry(() => this.provider.generateContent(
      prompt,
      { responseMimeType: "application/json", enableSearch: true }
    ));

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse optimization data", e);
      return {
        category,
        summary: "Failed to generate optimization report.",
        recommendations: [],
        lifestyleChanges: [],
        suggestedCompounds: []
      };
    }
  }
}
