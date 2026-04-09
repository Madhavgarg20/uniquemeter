import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { RestructuredIdea } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a startup idea analyst. The user will give you a raw idea description.
Return ONLY a valid JSON object with exactly these keys (no markdown, no preamble, no explanation):
{
  "one_liner": "A single crisp sentence describing what it does",
  "problem": "What problem does this solve?",
  "how_it_works": "Brief explanation of how the product works",
  "target_user": "Who is the primary user or customer?",
  "key_features": ["feature1", "feature2", "feature3", "feature4", "feature5"],
  "category": "One category like SaaS, Marketplace, Dev Tool, Consumer App, Fintech, Health Tech, EdTech, AI/ML, Social, Productivity, etc."
}
Ensure the JSON is valid. Do not wrap in code fences. Return the raw JSON only.`;

export async function POST(req: NextRequest) {
  try {
    const { idea } = await req.json();

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return NextResponse.json(
        { error: "Idea text is required" },
        { status: 400 }
      );
    }

    if (idea.length > 2000) {
      return NextResponse.json(
        { error: "Idea must be under 2000 characters" },
        { status: 400 }
      );
    }

    const result = await callGroqWithRetry(idea);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/restructure] Error:", error);
    return NextResponse.json(
      { error: "Failed to restructure idea. Please try again." },
      { status: 500 }
    );
  }
}

async function callGroqWithRetry(
  idea: string,
  retries = 1
): Promise<RestructuredIdea> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: idea },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      });

      const raw = completion.choices[0]?.message?.content ?? "";

      // Try to extract JSON from the response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        if (attempt < retries) continue;
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]) as RestructuredIdea;

      // Validate required fields exist
      const requiredFields: (keyof RestructuredIdea)[] = [
        "one_liner",
        "problem",
        "how_it_works",
        "target_user",
        "key_features",
        "category",
      ];

      for (const field of requiredFields) {
        if (!parsed[field]) {
          if (attempt < retries) continue;
          throw new Error(`Missing field: ${field}`);
        }
      }

      if (!Array.isArray(parsed.key_features)) {
        parsed.key_features = [String(parsed.key_features)];
      }

      return parsed;
    } catch (e) {
      if (attempt >= retries) throw e;
      // Retry with stricter prompt
      continue;
    }
  }

  throw new Error("Failed after retries");
}
