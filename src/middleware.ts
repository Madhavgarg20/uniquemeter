import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter
// In production with Vercel, use @vercel/kv for persistence across instances
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const MAX_REQUESTS = 5; // per IP
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getRateLimitInfo(ip: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    const newEntry = { count: 1, resetTime: now + WINDOW_MS };
    rateLimitMap.set(ip, newEntry);
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

// Clean up old entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, ip) => {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  });
}, 5 * 60 * 1000); // Every 5 minutes

export function middleware(req: NextRequest) {
  // Only rate-limit API routes (not pages or static assets)
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip rate limiting for log-export (it's just logging)
  if (req.nextUrl.pathname === "/api/log-export") {
    return NextResponse.next();
  }

  // Only rate-limit POST requests (the analysis endpoints)
  if (req.method !== "POST") {
    return NextResponse.next();
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Only rate-limit the first endpoint in the chain (restructure)
  // The subsequent calls (search, score) are part of the same analysis
  if (req.nextUrl.pathname !== "/api/restructure") {
    return NextResponse.next();
  }

  const { allowed, remaining } = getRateLimitInfo(ip);

  if (!allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Maximum ${MAX_REQUESTS} analyses per hour. Please try again later.`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
          "Retry-After": "3600",
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  response.headers.set("X-RateLimit-Remaining", String(remaining));

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
