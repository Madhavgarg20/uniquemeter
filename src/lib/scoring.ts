/**
 * UniqueMeter — Deterministic Scoring Engine
 *
 * All scoring is pure JavaScript. No AI involved.
 * This is non-negotiable: AI will flatter users every time.
 */

import type {
  ClassifiedResult,
  UsefulnessFactors,
  UniquenessBreakdown,
  UsefulnessBreakdown,
  ScoreResponse,
} from "./types";

// ─── Uniqueness penalties per match type ────────────────────────────────────

const PENALTIES = {
  exact_match: 30,
  similar: 12,
  adjacent: 5,
  open_source: 4,
  research: 2,
  irrelevant: 0,
} as const;

const PENALTY_CAPS = {
  exact_match: 60,  // max 2 exact hits matter
  similar: 36,      // max 3 similar
  adjacent: 15,     // max 3 adjacent
  open_source: 12,  // max 3 open source
  research: 6,      // max 3 research
} as const;

export function computeUniqueness(
  results: ClassifiedResult[]
): UniquenessBreakdown {
  const counts = {
    exact_match: 0,
    similar: 0,
    adjacent: 0,
    open_source: 0,
    research: 0,
    irrelevant: 0,
  };

  for (const r of results) {
    counts[r.match_type]++;
  }

  const exact_match_penalty = Math.min(
    counts.exact_match * PENALTIES.exact_match,
    PENALTY_CAPS.exact_match
  );
  const similar_penalty = Math.min(
    counts.similar * PENALTIES.similar,
    PENALTY_CAPS.similar
  );
  const adjacent_penalty = Math.min(
    counts.adjacent * PENALTIES.adjacent,
    PENALTY_CAPS.adjacent
  );
  const open_source_penalty = Math.min(
    counts.open_source * PENALTIES.open_source,
    PENALTY_CAPS.open_source
  );
  const research_penalty = Math.min(
    counts.research * PENALTIES.research,
    PENALTY_CAPS.research
  );

  const total_penalty =
    exact_match_penalty +
    similar_penalty +
    adjacent_penalty +
    open_source_penalty +
    research_penalty;

  const raw_score = Math.max(0, 100 - total_penalty);
  const final_score = Math.round(raw_score * 10) / 10;

  return {
    exact_match_count: counts.exact_match,
    exact_match_penalty,
    similar_count: counts.similar,
    similar_penalty,
    adjacent_count: counts.adjacent,
    adjacent_penalty,
    open_source_count: counts.open_source,
    open_source_penalty,
    research_count: counts.research,
    research_penalty,
    total_penalty,
    raw_score,
    final_score,
  };
}

// ─── Usefulness scoring ─────────────────────────────────────────────────────
// Formula: (PC×18 + MS×16 + PL×16 + TF×14 + RM×14 + TM×12 + DI×10) / 10

const USEFULNESS_WEIGHTS = {
  problem_clarity: 18,
  market_size: 16,
  pain_level: 16,
  technical_feasibility: 14,
  revenue_model: 14,
  timing: 12,
  differentiation: 10,
} as const;

export function computeUsefulness(
  factors: UsefulnessFactors
): UsefulnessBreakdown {
  const calc = (factor: keyof UsefulnessFactors) => ({
    score: factors[factor],
    weight: USEFULNESS_WEIGHTS[factor],
    weighted: factors[factor] * USEFULNESS_WEIGHTS[factor],
  });

  const breakdown = {
    problem_clarity: calc("problem_clarity"),
    market_size: calc("market_size"),
    pain_level: calc("pain_level"),
    technical_feasibility: calc("technical_feasibility"),
    revenue_model: calc("revenue_model"),
    timing: calc("timing"),
    differentiation: calc("differentiation"),
  };

  const total_weighted =
    breakdown.problem_clarity.weighted +
    breakdown.market_size.weighted +
    breakdown.pain_level.weighted +
    breakdown.technical_feasibility.weighted +
    breakdown.revenue_model.weighted +
    breakdown.timing.weighted +
    breakdown.differentiation.weighted;

  // Max possible = 10 * (18+16+16+14+14+12+10) = 10 * 100 = 1000
  // Divide by 10 → max 100
  const final_score = Math.round((total_weighted / 10) * 10) / 10;

  return {
    ...breakdown,
    total_weighted,
    final_score,
  };
}

// ─── Combined scorer ────────────────────────────────────────────────────────

export function computeScores(
  results: ClassifiedResult[],
  factors: UsefulnessFactors
): ScoreResponse {
  return {
    uniqueness: computeUniqueness(results),
    usefulness: computeUsefulness(factors),
  };
}
