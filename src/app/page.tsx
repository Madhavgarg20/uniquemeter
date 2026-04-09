import Link from "next/link";
import {
  Sparkles,
  Search,
  Calculator,
  ArrowRight,
  GitBranch,
  Zap,
  Shield,
  Brain,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            UniqueMeter
          </span>
          <Link
            href="/analyse"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Try it free &rarr;
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-800/50 text-xs text-indigo-300 mb-8">
          <Zap size={12} />
          Free. No signup. No BS.
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
          How unique is
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            your idea?
          </span>
        </h1>

        <p className="text-zinc-400 text-lg mt-6 max-w-xl mx-auto leading-relaxed">
          Describe your startup idea. AI restructures it, searches the entire
          internet, and gives you a{" "}
          <span className="text-white font-medium">
            brutally honest uniqueness and usefulness score.
          </span>{" "}
          No fluff. Pure math.
        </p>

        <Link
          href="/analyse"
          className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-lg shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50"
        >
          Analyse Your Idea
          <ArrowRight size={20} />
        </Link>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          Three steps. Zero ambiguity.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950 flex items-center justify-center">
              <Brain size={20} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-semibold">1. AI Restructures</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Groq&apos;s LLaMA 3.3 70B reformats your raw idea into a
              structured format — one-liner, problem statement, target user,
              features, category.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950 flex items-center justify-center">
              <Search size={20} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-semibold">2. Internet Search</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              5 parallel Tavily searches scan every repo, startup, product, and
              research paper. AI classifies each result as exact match, similar,
              adjacent, or irrelevant.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950 flex items-center justify-center">
              <Calculator size={20} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-semibold">3. Math Scoring</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Uniqueness scored by <span className="text-white">deterministic penalties</span> — no AI
              involved. Usefulness scored by 7 weighted factors with full
              formula shown. Transparent. Verifiable.
            </p>
          </div>
        </div>
      </section>

      {/* Why no AI scoring */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <div className="flex items-start gap-4">
            <Shield size={24} className="text-indigo-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-bold text-lg">
                Why the score uses math, not AI
              </h3>
              <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
                If AI computes your uniqueness score, it will flatter you every
                time. That&apos;s how language models work — they optimize for
                approval, not truth. UniqueMeter&apos;s uniqueness score is pure
                JavaScript: exact matches penalize 30 points, similar results
                penalize 12, adjacent 5, open source 4, research 2. All capped.
                All deterministic. You can verify the math yourself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring breakdown */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          The formulas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" />
              Uniqueness Score
            </h3>
            <div className="font-mono text-xs text-zinc-400 space-y-1">
              <p>start = 100</p>
              <p>− exact_matches × 30 <span className="text-zinc-600">(cap 60)</span></p>
              <p>− similar × 12 <span className="text-zinc-600">(cap 36)</span></p>
              <p>− adjacent × 5 <span className="text-zinc-600">(cap 15)</span></p>
              <p>− open_source × 4 <span className="text-zinc-600">(cap 12)</span></p>
              <p>− research × 2 <span className="text-zinc-600">(cap 6)</span></p>
              <hr className="border-zinc-800 my-2" />
              <p className="text-white">= final_score</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" />
              Usefulness Score
            </h3>
            <div className="font-mono text-xs text-zinc-400 space-y-1">
              <p>Problem Clarity × 18</p>
              <p>Market Size × 16</p>
              <p>Pain Level × 16</p>
              <p>Tech Feasibility × 14</p>
              <p>Revenue Model × 14</p>
              <p>Timing × 12</p>
              <p>Differentiation × 10</p>
              <hr className="border-zinc-800 my-2" />
              <p className="text-white">sum / 10 = final_score</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-24 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Stop guessing. Start knowing.
        </h2>
        <p className="text-zinc-400 mb-8">
          Takes 30 seconds. No account needed.
        </p>
        <Link
          href="/analyse"
          className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-lg shadow-lg shadow-indigo-900/30"
        >
          Analyse Your Idea Free
          <ArrowRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 py-6 flex justify-between items-center text-xs text-zinc-500">
          <span>UniqueMeter © {new Date().getFullYear()}</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              <GitBranch size={14} />
            </a>
            <span>
              Powered by{" "}
              <a href="https://groq.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">
                Groq
              </a>{" "}
              +{" "}
              <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">
                Tavily
              </a>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
