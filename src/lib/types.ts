// ─── Restructure types ───────────────────────────────────────────────────────

export interface RestructuredIdea {
  one_liner: string;
  problem: string;
  how_it_works: string;
  target_user: string;
  key_features: string[];
  category: string;
}

// ─── Search types ────────────────────────────────────────────────────────────

export type MatchType =
  | "exact_match"
  | "similar"
  | "adjacent"
  | "open_source"
  | "research"
  | "irrelevant";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  tavily_score: number;
}

export interface ClassifiedResult extends SearchResult {
  match_type: MatchType;
  similarity_pct: number;
  reason: string;
}

export interface UsefulnessFactors {
  problem_clarity: number;    // 0-10
  market_size: number;        // 0-10
  pain_level: number;         // 0-10
  technical_feasibility: number; // 0-10
  revenue_model: number;      // 0-10
  timing: number;             // 0-10
  differentiation: number;    // 0-10
}

export interface SearchResponse {
  classified_results: ClassifiedResult[];
  usefulness_factors: UsefulnessFactors;
}

// ─── Score types ─────────────────────────────────────────────────────────────

export interface UniquenessBreakdown {
  exact_match_count: number;
  exact_match_penalty: number;
  similar_count: number;
  similar_penalty: number;
  adjacent_count: number;
  adjacent_penalty: number;
  open_source_count: number;
  open_source_penalty: number;
  research_count: number;
  research_penalty: number;
  total_penalty: number;
  raw_score: number;
  final_score: number;
}

export interface UsefulnessBreakdown {
  problem_clarity: { score: number; weight: number; weighted: number };
  market_size: { score: number; weight: number; weighted: number };
  pain_level: { score: number; weight: number; weighted: number };
  technical_feasibility: { score: number; weight: number; weighted: number };
  revenue_model: { score: number; weight: number; weighted: number };
  timing: { score: number; weight: number; weighted: number };
  differentiation: { score: number; weight: number; weighted: number };
  total_weighted: number;
  final_score: number;
}

export interface ScoreResponse {
  uniqueness: UniquenessBreakdown;
  usefulness: UsefulnessBreakdown;
}

// ─── Combined analysis result ────────────────────────────────────────────────

export interface AnalysisResult {
  idea: RestructuredIdea;
  search: SearchResponse;
  scores: ScoreResponse;
}

// ─── UI state ────────────────────────────────────────────────────────────────

export type UIState = "idle" | "processing" | "results";

export interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
}
