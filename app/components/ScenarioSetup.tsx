"use client";

import { useState } from "react";
import type { Scenario } from "../data/scenarios";
import { OptionButton } from "./OptionButton";

const pressureOptions = ["Calm", "Normal", "High Pressure"];
const personalityOptions = ["Friendly", "Neutral", "Rushed", "Impatient"];

export function ScenarioSetup({ scenario }: { scenario: Scenario }) {
  const [pressure, setPressure] = useState("Normal");
  const [personality, setPersonality] = useState("Friendly");
  const [isStarting, setIsStarting] = useState(false);

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Practice Setup
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
          {scenario.title}
        </h1>
        <p className="mt-4 leading-7 text-slate-500">{scenario.description}</p>

        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            Difficulty
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {pressureOptions.map((option) => (
              <OptionButton
                key={option}
                label={option}
                selected={pressure === option}
                onClick={() => setPressure(option)}
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            NPC Personality
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {personalityOptions.map((option) => (
              <OptionButton
                key={option}
                label={option}
                selected={personality === option}
                onClick={() => setPersonality(option)}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">
            Goal
          </h2>
          <p className="mt-2 leading-7 text-blue-950">{scenario.goal}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsStarting(true)}
          className="mt-8 flex w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
        >
          Start Scenario
        </button>
      </section>

      {isStarting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="h-3 w-3 animate-ping rounded-full bg-blue-600" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-blue-950">
              AI Coach Starting...
            </h2>
            <p className="mt-3 leading-7 text-slate-500">
              This is where the live voice roleplay will begin.
            </p>
            <button
              type="button"
              onClick={() => setIsStarting(false)}
              className="mt-6 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
