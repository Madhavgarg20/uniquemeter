import { NextRequest, NextResponse } from "next/server";
import { computeScores } from "@/lib/scoring";
import type { ClassifiedResult, UsefulnessFactors } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { classified_results, usefulness_factors } = (await req.json()) as {
      classified_results: ClassifiedResult[];
      usefulness_factors: UsefulnessFactors;
    };

    if (!classified_results || !usefulness_factors) {
      return NextResponse.json(
        { error: "classified_results and usefulness_factors are required" },
        { status: 400 }
      );
    }

    const scores = computeScores(classified_results, usefulness_factors);

    return NextResponse.json(scores);
  } catch (error) {
    console.error("[/api/score] Error:", error);
    return NextResponse.json(
      { error: "Scoring failed." },
      { status: 500 }
    );
  }
}
