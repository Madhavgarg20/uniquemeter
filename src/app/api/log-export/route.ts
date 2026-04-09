import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // In production, log to analytics service or DB
    // For now, just log to console
    console.log("[PDF Export]", {
      timestamp: new Date().toISOString(),
      one_liner: body.one_liner || "unknown",
      uniqueness_score: body.uniqueness_score,
      usefulness_score: body.usefulness_score,
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ logged: true });
  } catch {
    return NextResponse.json({ logged: false }, { status: 500 });
  }
}
