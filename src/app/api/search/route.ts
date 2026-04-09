import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import type {
  RestructuredIdea,
  SearchResult,
  ClassifiedResult,
  UsefulnessFactors,
  SearchResponse,
} from "@/lib/types";

// ─── Generate 5 search queries from templates (no AI needed) ─────────────────

function generateQueries(idea: RestructuredIdea): string[] {
  const { one_liner, category } = idea;
  return [
    `${one_liner} app`,
    `${one_liner} tool`,
    `${category} startup`,
    `${one_liner} open source github`,
    `${one_liner} research paper`,
  ];
}

// ─── Deduplicate by domain — keep highest scored per domain ──────────────────

function deduplicateByDomain(results: SearchResult[]): SearchResult[] {
  const domainMap = new Map<string, SearchResult>();

  for (const r of results) {
    try {
      const domain = new URL(r.url).hostname;
      const existing = domainMap.get(domain);
      if (!existing || r.tavily_score > existing.tavily_score) {
        domainMap.set(domain, r);
      }
    } catch {
      // Invalid URL — skip
    }
  }

  return Array.from(domainMap.values())
    .sort((a, b) => b.tavily_score - a.tavily_score)
    .slice(0, 20);
}

// ─── Classify results with Groq ──────────────────────────────────────────────

const CLASSIFY_PROMPT = `You are a startup analyst. Given a structured idea and search results, classify each search result and rate the idea's usefulness.

For EACH search result, classify it as one of:
- exact_match: This IS the same product/idea, just already exists
- similar: Very similar concept, minor differences
- adjacent: Related space but meaningfully different approach
- open_source: An open-source project in the same space
- research: Academic research or paper about this concept
- irrelevant: Not meaningfully related

Also estimate similarity_pct (0-100) and give a brief reason.

Additionally, rate the IDEA itself on these usefulness factors (0-10 each):
- problem_clarity: How clearly defined is the problem?
- market_size: How large is the potential market?
- pain_level: How painful is the problem for users?
- technical_feasibility: How feasible to build with current tech?
- revenue_model: How clear is the path to revenue?
- timing: Is the timing right for this idea?
- differentiation: How differentiated from existing solutions?

Return ONLY valid JSON (no markdown, no code fences):
{
  "classified_results": [
    {
      "title": "result title",
      "url": "result url",
      "snippet": "result snippet",
      "tavily_score": 0.95,
      "match_type": "similar",
      "similarity_pct": 75,
      "reason": "Brief explanation"
    }
  ],
  "usefulness_factors": {
    "problem_clarity": 8,
    "market_size": 6,
    "pain_level": 7,
    "technical_feasibility": 9,
    "revenue_model": 5,
    "timing": 7,
    "differentiation": 4
  }
}`;

async function classifyResults(
  idea: RestructuredIdea,
  results: SearchResult[]
): Promise<SearchResponse> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const userContent = JSON.stringify({ idea, search_results: results });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: CLASSIFY_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Classification returned no JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate and sanitize classified results
  const classified_results: ClassifiedResult[] = (
    parsed.classified_results || []
  ).map((r: ClassifiedResult) => ({
    title: r.title || "Unknown",
    url: r.url || "",
    snippet: r.snippet || "",
    tavily_score: r.tavily_score || 0,
    match_type: [
      "exact_match",
      "similar",
      "adjacent",
      "open_source",
      "research",
      "irrelevant",
    ].includes(r.match_type)
      ? r.match_type
      : "irrelevant",
    similarity_pct: Math.max(0, Math.min(100, r.similarity_pct || 0)),
    reason: r.reason || "",
  }));

  // Validate usefulness factors
  const uf = parsed.usefulness_factors || {};
  const clamp = (v: number) => Math.max(0, Math.min(10, Math.round(v || 5)));

  const usefulness_factors: UsefulnessFactors = {
    problem_clarity: clamp(uf.problem_clarity),
    market_size: clamp(uf.market_size),
    pain_level: clamp(uf.pain_level),
    technical_feasibility: clamp(uf.technical_feasibility),
    revenue_model: clamp(uf.revenue_model),
    timing: clamp(uf.timing),
    differentiation: clamp(uf.differentiation),
  };

  return { classified_results, usefulness_factors };
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { idea } = (await req.json()) as { idea: RestructuredIdea };

    if (!idea || !idea.one_liner) {
      return NextResponse.json(
        { error: "Restructured idea is required" },
        { status: 400 }
      );
    }

    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });

    // 1) Generate 5 query strings from templates
    const queries = generateQueries(idea);

    // 2) Fire all 5 Tavily searches in parallel
    const tavilyResults = await Promise.all(
      queries.map(async (q) => {
        try {
          const response = await tvly.search(q, {
            maxResults: 5,
            searchDepth: "basic",
          });
          return (response.results || []).map(
            (r): SearchResult => ({
              title: r.title || "",
              url: r.url || "",
              snippet: r.content || "",
              tavily_score: r.score || 0,
            })
          );
        } catch (err) {
          console.error(`Tavily search failed for "${q}":`, err);
          return [] as SearchResult[];
        }
      })
    );

    // 3) Flatten and deduplicate
    const allResults = tavilyResults.flat();
    const deduped = deduplicateByDomain(allResults);

    if (deduped.length === 0) {
      // No search results — return empty classification with neutral scores
      return NextResponse.json({
        classified_results: [],
        usefulness_factors: {
          problem_clarity: 5,
          market_size: 5,
          pain_level: 5,
          technical_feasibility: 5,
          revenue_model: 5,
          timing: 5,
          differentiation: 5,
        },
      } as SearchResponse);
    }

    // 4) Send to Groq for classification + usefulness rating
    const classified = await classifyResults(idea, deduped);

    return NextResponse.json(classified);
  } catch (error) {
    console.error("[/api/search] Error:", error);
    return NextResponse.json(
      { error: "Search and classification failed. Please try again." },
      { status: 500 }
    );
  }
}
