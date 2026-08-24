export interface ScoreDTO {
  id: string;
  total: number;
  criteriaSnapshot: {
    name: string;
    weight: number;
    score: number;
    rationale: string;
  }[];
  rationale: string | null;
  createdAt: string;
}

export interface HouseDTO {
  id: string;
  title: string | null;
  description: string | null;
  energyLabel: string | null;
  livingArea: number | null;
  plotSize: number | null;
  price: number | null;
  address: string | null;
  listingStatus: string | null;
  imagePath: string | null;
  images: string[];
  sourceFileName: string | null;
  source: string;
  fundaUrl: string | null;
  status: string;
  error: string | null;
  progress: number;
  progressLabel: string | null;
  documentAnalysis: DocumentAnalysis | null;
  createdAt: string;
  scores: ScoreDTO[];
}

export interface SearchProfileDTO {
  id: string;
  name: string;
  cities: string[];
  priceMin: number | null;
  priceMax: number | null;
  objectTypes: string[];
  livingAreaMin: number | null;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunError: string | null;
  lastRunCount: number | null;
  createdAt: string;
}

export interface CriteriaDTO {
  id: string;
  name: string;
  weight: number;
  description: string | null;
}

export type RiskSeverity = "low" | "medium" | "high";

export interface RiskFactor {
  title: string;
  detail: string;
  severity: RiskSeverity;
}

export interface DocumentAnalysis {
  energyLabel: {
    label: string | null;
    summary: string | null;
  };
  questionnaire: {
    present: boolean;
    summary: string | null;
  };
  itemsList: {
    present: boolean;
    summary: string | null;
  };
  summary: string;
  riskFactors: RiskFactor[];
}

export type DocumentSectionType =
  | "energyLabel"
  | "questionnaire"
  | "itemsList";
