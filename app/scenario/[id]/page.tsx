import Link from "next/link";
import { FeedbackItem } from "../../components/FeedbackItem";
import { Navbar } from "../../components/Navbar";
import { ScenarioSetup } from "../../components/ScenarioSetup";
import { getScenarioById, scenarios } from "../../data/scenarios";

export function generateStaticParams() {
  return scenarios.map((scenario) => ({ id: scenario.id }));
}

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = getScenarioById(id);

  if (!scenario) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-5 text-center">
          <h1 className="text-4xl font-black tracking-tight text-blue-950">
            Scenario not found
          </h1>
          <p className="mt-4 leading-7 text-slate-500">
            That practice scene is not in the demo library yet.
          </p>
          <Link
            href="/home"
            className="mt-7 rounded-full bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Back to Scenarios
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
        <ScenarioSetup scenario={scenario} />

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Scenario Details
            </p>
            <h2 className="mt-3 text-2xl font-bold text-blue-950">
              What you will practice
            </h2>
            <p className="mt-4 leading-7 text-slate-600">{scenario.details}</p>
            <ul className="mt-6 space-y-3 text-slate-600">
              {[
                "Practice asking questions clearly",
                "Handle follow-up questions",
                "Build confidence under realistic pressure",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-950">
              After the conversation, you&apos;ll get feedback on:
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <FeedbackItem
                title="Clarity"
                description="Whether your questions and answers were easy to understand."
              />
              <FeedbackItem
                title="Confidence"
                description="How steady, direct, and prepared you sounded."
              />
              <FeedbackItem
                title="Natural phrasing"
                description="More fluent ways to express the same idea."
              />
              <FeedbackItem
                title="Cultural fit"
                description="Tone and social expectations for the situation."
              />
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
