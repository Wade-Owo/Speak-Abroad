import Link from "next/link";
import type { Scenario } from "../data/scenarios";
import { ScenarioIcon } from "./ScenarioIcon";

const difficultyStyles: Record<Scenario["difficulty"], string> = {
  Easy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Hard: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <Link
      href={`/scenario/${scenario.id}`}
      className="group flex min-h-64 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <ScenarioIcon name={scenario.iconName} className="h-6 w-6" />
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${difficultyStyles[scenario.difficulty]}`}
          >
            {scenario.difficulty}
          </span>
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {scenario.category}
        </p>
        <h2 className="mt-2 text-xl font-bold leading-tight text-blue-950">
          {scenario.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {scenario.description}
        </p>
      </div>
      <div className="mt-6 flex items-center justify-between text-sm font-semibold text-blue-700">
        <span>Start</span>
        <svg
          aria-hidden="true"
          className="h-5 w-5 transition group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </div>
    </Link>
  );
}
