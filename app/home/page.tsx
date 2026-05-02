import { Navbar } from "../components/Navbar";
import { ScenarioCard } from "../components/ScenarioCard";
import { scenarios } from "../data/scenarios";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Practice Library
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-blue-950 sm:text-5xl">
              Scenarios
            </h1>
            <p className="mt-3 text-lg text-slate-500">
              Choose a real-life situation to practice.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-blue-950">
              8 roleplays ready
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Campus, daily life, health, and career
            </p>
          </div>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </main>
    </div>
  );
}
