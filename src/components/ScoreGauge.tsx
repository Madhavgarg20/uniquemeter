"use client";

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
}

function getColor(score: number): string {
  if (score >= 75) return "#22c55e"; // green
  if (score >= 50) return "#eab308"; // yellow
  if (score >= 25) return "#f97316"; // orange
  return "#ef4444"; // red
}

export default function ScoreGauge({
  score,
  label,
  size = 160,
}: ScoreGaugeProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="8"
        />
        {/* Score arc */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-animated transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-zinc-400">/100</span>
      </div>
      <p className="text-sm font-medium text-zinc-300 mt-1">{label}</p>
    </div>
  );
}
