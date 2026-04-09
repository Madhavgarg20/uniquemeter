import type { MatchType } from "@/lib/types";

const BADGE_CONFIG: Record<
  MatchType,
  { label: string; bg: string; text: string; className: string }
> = {
  exact_match: {
    label: "Exact Match",
    bg: "bg-red-900/50",
    text: "text-red-300",
    className: "badge-exact",
  },
  similar: {
    label: "Similar",
    bg: "bg-orange-900/50",
    text: "text-orange-300",
    className: "badge-similar",
  },
  adjacent: {
    label: "Adjacent",
    bg: "bg-yellow-900/50",
    text: "text-yellow-300",
    className: "badge-adjacent",
  },
  open_source: {
    label: "Open Source",
    bg: "bg-green-900/50",
    text: "text-green-300",
    className: "badge-opensource",
  },
  research: {
    label: "Research",
    bg: "bg-blue-900/50",
    text: "text-blue-300",
    className: "badge-research",
  },
  irrelevant: {
    label: "Irrelevant",
    bg: "bg-zinc-800",
    text: "text-zinc-400",
    className: "",
  },
};

export default function MatchBadge({ type }: { type: MatchType }) {
  const config = BADGE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text} ${config.className}`}
    >
      {config.label}
    </span>
  );
}
