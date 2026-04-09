"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Download, Loader2, Sparkles, Search, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import ScoreGauge from "@/components/ScoreGauge";
import ResultCard from "@/components/ResultCard";
import type {
  UIState,
  ProcessingStep,
  RestructuredIdea,
  SearchResponse,
  ScoreResponse,
  AnalysisResult,
} from "@/lib/types";

const MAX_CHARS = 2000;

const INITIAL_STEPS: ProcessingStep[] = [
  { id: "restructure", label: "Restructuring your idea with AI", status: "pending" },
  { id: "search", label: "Searching the internet (5 parallel queries)", status: "pending" },
  { id: "classify", label: "Classifying results & rating usefulness", status: "pending" },
  { id: "score", label: "Computing scores (deterministic math)", status: "pending" },
];

export default function AnalysePage() {
  const [uiState, setUiState] = useState<UIState>("idle");
  const [idea, setIdea] = useState("");
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showUsefulnessBreakdown, setShowUsefulnessBreakdown] = useState(false);

  const updateStep = useCallback(
    (id: string, status: ProcessingStep["status"]) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    },
    []
  );

  const analyse = useCallback(async () => {
    if (!idea.trim() || idea.length > MAX_CHARS) return;

    setUiState("processing");
    setError(null);
    setSteps(INITIAL_STEPS);

    try {
      // Step 1: Restructure
      updateStep("restructure", "active");
      const restructureRes = await fetch("/api/restructure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim() }),
      });

      if (!restructureRes.ok) {
        const err = await restructureRes.json();
        throw new Error(err.error || "Restructure failed");
      }

      const restructured: RestructuredIdea = await restructureRes.json();
      updateStep("restructure", "done");

      // Step 2 + 3: Search + Classify (combined in one API call)
      updateStep("search", "active");
      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: restructured }),
      });

      if (!searchRes.ok) {
        const err = await searchRes.json();
        throw new Error(err.error || "Search failed");
      }

      const searchData: SearchResponse = await searchRes.json();
      updateStep("search", "done");
      updateStep("classify", "done");

      // Step 4: Score (deterministic math)
      updateStep("score", "active");
      const scoreRes = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classified_results: searchData.classified_results,
          usefulness_factors: searchData.usefulness_factors,
        }),
      });

      if (!scoreRes.ok) {
        const err = await scoreRes.json();
        throw new Error(err.error || "Scoring failed");
      }

      const scores: ScoreResponse = await scoreRes.json();
      updateStep("score", "done");

      setResult({
        idea: restructured,
        search: searchData,
        scores,
      });
      setUiState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setUiState("idle");
      setSteps(INITIAL_STEPS);
    }
  }, [idea, updateStep]);

  const handleExport = async () => {
    if (!result) return;

    // Log export event
    try {
      await fetch("/api/log-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          one_liner: result.idea.one_liner,
          uniqueness_score: result.scores.uniqueness.final_score,
          usefulness_score: result.scores.usefulness.final_score,
        }),
      });
    } catch {} // eslint-disable-line no-empty

    window.print();
  };

  const reset = () => {
    setUiState("idle");
    setResult(null);
    setError(null);
    setSteps(INITIAL_STEPS);
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 no-print">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            UniqueMeter
          </h1>
          {uiState === "results" && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <Download size={14} />
              Save PDF
            </button>
          )}
          {uiState !== "results" && <div className="w-20" />}
        </div>
      </header>

      {/* Print header */}
      <div className="print-only text-center py-6 border-b">
        <h1 className="text-2xl font-bold">UniqueMeter Report</h1>
        <p className="text-sm text-gray-500 mt-1">Generated {new Date().toLocaleDateString()}</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ─── IDLE STATE ─── */}
        {uiState === "idle" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Describe your idea
              </h2>
              <p className="text-zinc-400 text-sm">
                Be specific. What does it do? Who is it for? How does it work?
              </p>
            </div>

            <div className="relative">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value.slice(0, MAX_CHARS))}
                placeholder="e.g. An app that uses AI to analyze restaurant menus and tells you the best value dishes based on portion size, ingredients, and price compared to similar restaurants in the area..."
                className="w-full h-48 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm leading-relaxed"
                autoFocus
              />
              <div className="absolute bottom-3 right-3 text-xs text-zinc-500">
                <span className={idea.length > MAX_CHARS * 0.9 ? "text-amber-400" : ""}>
                  {idea.length}
                </span>
                /{MAX_CHARS}
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={analyse}
              disabled={!idea.trim() || idea.length > MAX_CHARS}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Analyse Uniqueness & Usefulness
            </button>

            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { icon: "🧠", title: "AI Restructure", desc: "Groq reformats your raw idea" },
                { icon: "🔍", title: "Internet Search", desc: "5 parallel Tavily queries" },
                { icon: "📊", title: "Math Scoring", desc: "Deterministic, no AI slop" },
              ].map((f) => (
                <div
                  key={f.title}
                  className="text-center p-3 rounded-lg bg-zinc-900/50 border border-zinc-800"
                >
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="text-xs font-medium text-zinc-300">
                    {f.title}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── PROCESSING STATE ─── */}
        {uiState === "processing" && (
          <div className="max-w-md mx-auto space-y-6 pt-16">
            <div className="text-center">
              <Loader2
                size={40}
                className="animate-spin text-indigo-400 mx-auto mb-4"
              />
              <h2 className="text-xl font-bold text-white">
                Analysing your idea...
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                This takes 15–30 seconds
              </p>
            </div>

            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    step.status === "active"
                      ? "border-indigo-500/50 bg-indigo-950/30"
                      : step.status === "done"
                      ? "border-green-800/50 bg-green-950/20"
                      : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  {step.status === "active" && (
                    <Loader2
                      size={16}
                      className="animate-spin text-indigo-400 shrink-0"
                    />
                  )}
                  {step.status === "done" && (
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5L4 7L8 3"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                  {step.status === "pending" && (
                    <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" />
                  )}
                  {step.status === "error" && (
                    <div className="w-4 h-4 rounded-full bg-red-500 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      step.status === "active"
                        ? "text-indigo-300"
                        : step.status === "done"
                        ? "text-green-300"
                        : "text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── RESULTS STATE ─── */}
        {uiState === "results" && result && (
          <div className="space-y-8">
            {/* Restructured Idea Card */}
            <section className="score-card bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                Your Idea (Restructured)
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs uppercase tracking-wider text-zinc-500">
                    One-liner
                  </span>
                  <p className="text-white font-medium">
                    {result.idea.one_liner}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-zinc-500">
                      Problem
                    </span>
                    <p className="text-zinc-300 text-sm">
                      {result.idea.problem}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-zinc-500">
                      How it works
                    </span>
                    <p className="text-zinc-300 text-sm">
                      {result.idea.how_it_works}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-zinc-500">
                      Target User
                    </span>
                    <p className="text-zinc-300 text-sm">
                      {result.idea.target_user}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-zinc-500">
                      Category
                    </span>
                    <p className="text-zinc-300 text-sm">
                      {result.idea.category}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-zinc-500">
                    Key Features
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {result.idea.key_features.map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded-md"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Score Gauges */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="score-card bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center">
                <div className="relative">
                  <ScoreGauge
                    score={result.scores.uniqueness.final_score}
                    label="Uniqueness Score"
                  />
                </div>
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="mt-4 flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors no-print"
                >
                  {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showBreakdown ? "Hide" : "Show"} math breakdown
                </button>
                {showBreakdown && (
                  <div className="mt-3 w-full text-xs space-y-1 font-mono text-zinc-400 border-t border-zinc-800 pt-3">
                    <p>Starting score: 100</p>
                    <p>
                      − Exact matches: {result.scores.uniqueness.exact_match_count} × 30 ={" "}
                      <span className="text-red-400">−{result.scores.uniqueness.exact_match_penalty}</span>
                      {result.scores.uniqueness.exact_match_penalty >= 60 && " (capped at 60)"}
                    </p>
                    <p>
                      − Similar: {result.scores.uniqueness.similar_count} × 12 ={" "}
                      <span className="text-orange-400">−{result.scores.uniqueness.similar_penalty}</span>
                      {result.scores.uniqueness.similar_penalty >= 36 && " (capped at 36)"}
                    </p>
                    <p>
                      − Adjacent: {result.scores.uniqueness.adjacent_count} × 5 ={" "}
                      <span className="text-yellow-400">−{result.scores.uniqueness.adjacent_penalty}</span>
                      {result.scores.uniqueness.adjacent_penalty >= 15 && " (capped at 15)"}
                    </p>
                    <p>
                      − Open Source: {result.scores.uniqueness.open_source_count} × 4 ={" "}
                      <span className="text-green-400">−{result.scores.uniqueness.open_source_penalty}</span>
                      {result.scores.uniqueness.open_source_penalty >= 12 && " (capped at 12)"}
                    </p>
                    <p>
                      − Research: {result.scores.uniqueness.research_count} × 2 ={" "}
                      <span className="text-blue-400">−{result.scores.uniqueness.research_penalty}</span>
                      {result.scores.uniqueness.research_penalty >= 6 && " (capped at 6)"}
                    </p>
                    <hr className="border-zinc-800" />
                    <p className="font-bold text-white">
                      Total penalty: −{result.scores.uniqueness.total_penalty} → Score:{" "}
                      {result.scores.uniqueness.final_score}/100
                    </p>
                  </div>
                )}
              </div>

              <div className="score-card bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center">
                <div className="relative">
                  <ScoreGauge
                    score={result.scores.usefulness.final_score}
                    label="Usefulness Score"
                  />
                </div>
                <button
                  onClick={() => setShowUsefulnessBreakdown(!showUsefulnessBreakdown)}
                  className="mt-4 flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors no-print"
                >
                  {showUsefulnessBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showUsefulnessBreakdown ? "Hide" : "Show"} factor breakdown
                </button>
                {showUsefulnessBreakdown && (
                  <div className="mt-3 w-full text-xs space-y-1 font-mono text-zinc-400 border-t border-zinc-800 pt-3">
                    <p className="text-zinc-500 mb-2">Formula: (PC×18 + MS×16 + PL×16 + TF×14 + RM×14 + TM×12 + DI×10) / 10</p>
                    {(
                      [
                        ["Problem Clarity", result.scores.usefulness.problem_clarity],
                        ["Market Size", result.scores.usefulness.market_size],
                        ["Pain Level", result.scores.usefulness.pain_level],
                        ["Tech Feasibility", result.scores.usefulness.technical_feasibility],
                        ["Revenue Model", result.scores.usefulness.revenue_model],
                        ["Timing", result.scores.usefulness.timing],
                        ["Differentiation", result.scores.usefulness.differentiation],
                      ] as const
                    ).map(([name, data]) => (
                      <div key={name} className="flex justify-between">
                        <span>{name}</span>
                        <span>
                          {data.score}/10 × {data.weight} ={" "}
                          <span className="text-indigo-300">{data.weighted}</span>
                        </span>
                      </div>
                    ))}
                    <hr className="border-zinc-800" />
                    <p className="font-bold text-white">
                      Total: {result.scores.usefulness.total_weighted} / 10 ={" "}
                      {result.scores.usefulness.final_score}/100
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Search Results */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Search size={18} className="text-indigo-400" />
                What We Found ({result.search.classified_results.filter(r => r.match_type !== "irrelevant").length} relevant results)
              </h3>
              {result.search.classified_results.filter(r => r.match_type !== "irrelevant").length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                  <p className="text-zinc-400">
                    No similar products or projects found. This idea appears to be highly unique!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.search.classified_results
                    .filter((r) => r.match_type !== "irrelevant")
                    .sort((a, b) => b.similarity_pct - a.similarity_pct)
                    .map((r, i) => (
                      <ResultCard key={i} result={r} />
                    ))}
                </div>
              )}
            </section>

            {/* Verdict */}
            <section className="score-card bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calculator size={18} className="text-indigo-400" />
                Verdict
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500 text-xs uppercase tracking-wider">
                    Uniqueness
                  </span>
                  <p className="text-zinc-200">
                    {result.scores.uniqueness.final_score >= 75
                      ? "Highly unique. Nothing quite like this exists yet."
                      : result.scores.uniqueness.final_score >= 50
                      ? "Moderately unique. Some similar things exist, but there's room to differentiate."
                      : result.scores.uniqueness.final_score >= 25
                      ? "Limited uniqueness. Several similar products/projects already exist."
                      : "Very crowded space. Nearly identical solutions already available."}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs uppercase tracking-wider">
                    Usefulness
                  </span>
                  <p className="text-zinc-200">
                    {result.scores.usefulness.final_score >= 75
                      ? "Very useful. Clear problem, big market, strong feasibility."
                      : result.scores.usefulness.final_score >= 50
                      ? "Moderately useful. Decent potential but some factors need work."
                      : result.scores.usefulness.final_score >= 25
                      ? "Marginal usefulness. Unclear problem or limited market."
                      : "Low usefulness signal. Rethink the problem and target user."}
                  </p>
                </div>
              </div>
            </section>

            {/* Action buttons */}
            <div className="flex gap-3 no-print">
              <button
                onClick={reset}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all text-sm"
              >
                Analyse Another Idea
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <Download size={14} />
                Save as PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
