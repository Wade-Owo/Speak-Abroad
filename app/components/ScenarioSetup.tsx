"use client";

import Link from "next/link";
import { useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VoiceAssistantControlBar } from "@livekit/components-react";
import "@livekit/components-styles";
import type { Scenario } from "../data/scenarios";
import { OptionButton } from "./OptionButton";

const pressureOptions = ["Calm", "Normal", "High Pressure"];
const personalityOptions = ["Friendly", "Neutral", "Rushed", "Impatient"];

export function ScenarioSetup({ scenario }: { scenario: Scenario }) {
  const [pressure, setPressure] = useState("Normal");
  const [personality, setPersonality] = useState("Friendly");
  const [token, setToken] = useState<string | null>(null);

  const startLiveKitSession = async () => {
    // Fetch the token with the selected parameters
    const res = await fetch(`/api/livekit?room=${scenario.id}&pressure=${pressure}&personality=${personality}`);
    const data = await res.json();
    setToken(data.token);
  };

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5 sm:p-8">
        
        {/* TEAMMATE'S NEW BACK BUTTON */}
        <Link
          href="/home"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M19 12H5" />
            <path d="m11 18-6-6 6-6" />
          </svg>
          Back to Scenarios
        </Link>

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
          onClick={startLiveKitSession}
          className="mt-8 flex w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
        >
          Start Scenario
        </button>
      </section>

      {/* YOUR LIVEKIT MODAL LOGIC */}
      {token ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">
            <LiveKitRoom
              serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
              token={token}
              connect={true}
              audio={true}
              onDisconnected={() => setToken(null)}
            >
              <h2 className="text-2xl font-bold text-blue-950 mb-2">Live Practice</h2>
              <p className="mb-6 text-slate-500">
                {personality} AI • {pressure} Pressure
              </p>

              {/* Renders the visualizer and mute/disconnect buttons */}
              <VoiceAssistantControlBar />
              <RoomAudioRenderer />
              
            </LiveKitRoom>
          </div>
        </div>
      ) : null}
    </>
  );
}