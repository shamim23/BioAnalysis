export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  output?: string;
}

export interface Product {
  name: string;
  brand: string;
  price?: string;
  rating?: number;
  description: string;
  url: string;
  image?: string;
}

export interface ComparisonData {
  summary: string;
  comparisonTable: {
    feature: string;
    [brand: string]: string;
  }[];
  verdict: string;
}

export interface ContaminantData {
  summary: string;
  alerts: {
    brand: string;
    contaminant: string;
    level: string;
    source: string;
    date: string;
    status: 'warning' | 'recall' | 'safe';
  }[];
  generalRisks: string;
}

export interface OptimizationResult {
  category: string;
  summary: string;
  recommendations: {
    title: string;
    description: string;
    evidenceLevel: 'high' | 'medium' | 'low';
    mechanism: string;
  }[];
  lifestyleChanges: string[];
  suggestedCompounds: string[];
}

export interface ResearchReport {
  compound: string;
  biomarkers?: string;
  timestamp: string;
  content: string;
  products?: Product[];
  comparison?: ComparisonData;
  purity?: ContaminantData;
  optimization?: OptimizationResult;
}
