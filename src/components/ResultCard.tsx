import type { ClassifiedResult } from "@/lib/types";
import MatchBadge from "./MatchBadge";
import { ExternalLink } from "lucide-react";

export default function ResultCard({ result }: { result: ClassifiedResult }) {
  if (result.match_type === "irrelevant") return null;

  return (
    <div className="result-card border border-zinc-800 rounded-lg p-4 space-y-2 hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <MatchBadge type={result.match_type} />
            <span className="text-xs text-zinc-500">
              {result.similarity_pct}% similar
            </span>
          </div>
          <h4 className="text-sm font-medium text-zinc-200 mt-1 truncate">
            {result.title}
          </h4>
        </div>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-300 shrink-0"
        >
          <ExternalLink size={14} />
        </a>
      </div>
      <p className="text-xs text-zinc-400 line-clamp-2">{result.snippet}</p>
      <p className="text-xs text-zinc-500 italic">{result.reason}</p>
    </div>
  );
}
