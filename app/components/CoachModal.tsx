"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import { useEffect, useState } from "react";
import { ConnectionState } from "livekit-client";
import type { Scenario } from "../data/scenarios";

export type CoachModalState =
  | "briefing"
  | "loading"
  | "live"
  | "processing"
  | "feedback"
  | "error";

type CoachModalProps = {
  scenario: Scenario;
  pressure: string;
  personality: string;
  onClose: () => void;
};

type SpeakerStatus =
  | "Setting up..."
  | "Listening..."
  | "AI speaking..."
  | "Waiting for your response..."
  | "Muted";

const roleLabels: Record<Scenario["iconName"], string> = {
  cart: "Cashier",
  professor: "Professor",
  party: "Student",
  calendar: "Host",
  classmate: "Classmate",
  doctor: "Doctor",
  briefcase: "Interviewer",
  home: "Roommate",
};

const scenarioTips: Record<Scenario["iconName"], string> = {
  cart: "Try starting with “Excuse me” when asking for help in a store.",
  professor: "Be direct about what confused you, then confirm the next step.",
  party: "Ask one friendly follow-up question before changing topics.",
  calendar: "Repeat the date and time back to confirm the reservation.",
  classmate: "Mention what you already tried before asking for help.",
  doctor: "Describe when the symptom started and how severe it feels.",
  briefcase: "Keep small talk warm, brief, and professional.",
  home: "Use calm, specific language when discussing shared expectations.",
};

function starterLabel(starter: Scenario["conversationStarter"]) {
  return starter === "ai" ? "Coach starts" : "You start";
}

function starterCue(starter: Scenario["conversationStarter"]) {
  return starter === "ai"
    ? "Wait for the coach to begin."
    : "Start by speaking first.";
}

function starterExplanation(starter: Scenario["conversationStarter"]) {
  return starter === "ai"
    ? "Wait for the AI coach to begin the conversation."
    : "Start the conversation by speaking first.";
}

export function CoachModal({
  scenario,
  pressure,
  personality,
  onClose,
}: CoachModalProps) {
  const [modalState, setModalState] = useState<CoachModalState>("briefing");
  const [token, setToken] = useState<string>();
  const [serverUrl, setServerUrl] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isMockMode, setIsMockMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (modalState !== "loading" || isMockMode) {
      return;
    }

    const controller = new AbortController();

    async function fetchToken() {
      setErrorMessage(undefined);
      setToken(undefined);
      setServerUrl(undefined);

      try {
        const params = new URLSearchParams({
          scenarioId: scenario.id,
          pressure,
          personality,
        });
        const response = await fetch(`/api/livekit?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          token?: string;
          serverUrl?: string;
          error?: string;
        };

        if (!response.ok || !data.token || !data.serverUrl) {
          throw new Error(data.error || "Could not start the LiveKit session.");
        }

        setToken(data.token);
        setServerUrl(data.serverUrl);
        setModalState("live");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not start the LiveKit session.",
        );
        setModalState("error");
      }
    }

    fetchToken();

    return () => controller.abort();
  }, [isMockMode, modalState, personality, pressure, retryCount, scenario.id]);

  useEffect(() => {
    if (modalState !== "processing") {
      return;
    }

    const timer = window.setTimeout(() => setModalState("feedback"), 1500);

    return () => window.clearTimeout(timer);
  }, [modalState]);

  const retryLiveKit = () => {
    setIsMockMode(false);
    setModalState("loading");
    setRetryCount((current) => current + 1);
  };

  const useMockMode = () => {
    setIsMockMode(true);
    setErrorMessage(undefined);
    setToken(undefined);
    setServerUrl(undefined);
    setModalState("live");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/45 p-4 backdrop-blur-sm">
      {modalState === "briefing" ? (
        <BriefingCard
          scenario={scenario}
          pressure={pressure}
          personality={personality}
          onBegin={() => setModalState("loading")}
          onClose={onClose}
        />
      ) : null}

      {modalState === "loading" ? (
        <LoadingCard scenario={scenario} onClose={onClose} />
      ) : null}

      {modalState === "live" ? (
        isMockMode ? (
          <MockLivePractice
            scenario={scenario}
            pressure={pressure}
            personality={personality}
            onClose={onClose}
            onEnd={() => setModalState("processing")}
          />
        ) : token && serverUrl ? (
          <LiveKitRoom
            serverUrl={serverUrl}
            token={token}
            connect
            audio
            onError={(error) => {
              setErrorMessage(error.message);
              setModalState("error");
            }}
            onMediaDeviceFailure={(_, kind) => {
              setErrorMessage(
                `Could not access your ${kind || "audio"} device.`,
              );
              setModalState("error");
            }}
            onDisconnected={() => setModalState("processing")}
          >
            <LiveCoachContent
              scenario={scenario}
              pressure={pressure}
              personality={personality}
              onClose={onClose}
              onEnd={() => setModalState("processing")}
            />
            <RoomAudioRenderer />
          </LiveKitRoom>
        ) : null
      ) : null}

      {modalState === "error" ? (
        <ErrorCard
          message={errorMessage || "Could not start the LiveKit session."}
          onRetry={retryLiveKit}
          onUseMock={useMockMode}
          onClose={onClose}
        />
      ) : null}

      {modalState === "processing" ? (
        <ProcessingCard onClose={onClose} />
      ) : null}

      {modalState === "feedback" ? (
        <FeedbackSummary
          onClose={onClose}
          onTryAgain={retryLiveKit}
        />
      ) : null}
    </div>
  );
}

function BriefingCard({
  scenario,
  pressure,
  personality,
  onBegin,
  onClose,
}: CoachModalProps & { onBegin: () => void }) {
  const role = roleLabels[scenario.iconName].toLowerCase();

  return (
    <section className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <FloatingCloseButton onClose={onClose} label="Close briefing modal" />

      <div className="pr-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          Before You Start
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-blue-950">
          {scenario.title}
        </h2>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Scenario
          </p>
          <p className="mt-3 leading-7 text-slate-700">
            {scenario.description}
          </p>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
            Conversation Starter
          </p>
          <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
            {starterLabel(scenario.conversationStarter)}
          </span>
          <p className="mt-3 leading-7 text-slate-700">
            {starterExplanation(scenario.conversationStarter)}
          </p>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
            Your Goal
          </p>
          <p className="mt-3 text-lg font-bold leading-8 text-blue-950">
            {scenario.detailedGoal}
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Success Checklist
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {scenario.successCriteria.map((criterion) => (
              <div
                key={criterion}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <CheckIcon />
                </span>
                <p className="text-sm font-semibold leading-6 text-slate-700">
                  {criterion}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
            {pressure} pressure
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            {personality} {role}
          </span>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Back to Scenario
          </button>
          <button
            type="button"
            onClick={onBegin}
            className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Begin Practice
          </button>
        </div>
      </div>
    </section>
  );
}

function LiveCoachContent({
  scenario,
  pressure,
  personality,
  onClose,
  onEnd,
}: CoachModalProps & { onEnd: () => void }) {
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const participants = useParticipants({ room });
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant({
    room,
  });

  const aiSpeaking =
    participants.some(
      (participant) =>
        participant.identity !== localParticipant.identity &&
        participant.isSpeaking,
    );

  const speakerStatus: SpeakerStatus =
    connectionState !== ConnectionState.Connected
      ? "Setting up..."
      : !isMicrophoneEnabled
        ? "Muted"
        : aiSpeaking
          ? "AI speaking..."
          : "Listening...";

  return (
    <LivePracticeLayout
      scenario={scenario}
      pressure={pressure}
      personality={personality}
      isMuted={!isMicrophoneEnabled}
      speakerStatus={speakerStatus}
      aiSpeaking={aiSpeaking}
      onClose={onClose}
      onEnd={() => {
        room.disconnect();
        onEnd();
      }}
      onToggleMuted={() => {
        localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
      }}
    />
  );
}

function MockLivePractice({
  scenario,
  pressure,
  personality,
  onClose,
  onEnd,
}: CoachModalProps & { onEnd: () => void }) {
  const [isMuted, setIsMuted] = useState(false);
  const [speakerStatus, setSpeakerStatus] =
    useState<SpeakerStatus>("Listening...");

  useEffect(() => {
    if (isMuted) {
      return;
    }

    const statuses: SpeakerStatus[] = [
      "Listening...",
      "AI speaking...",
      "Waiting for your response...",
    ];
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % statuses.length;
      setSpeakerStatus(statuses[index]);
    }, 2200);

    return () => window.clearInterval(timer);
  }, [isMuted]);

  return (
    <LivePracticeLayout
      scenario={scenario}
      pressure={pressure}
      personality={personality}
      isMuted={isMuted}
      speakerStatus={isMuted ? "Muted" : speakerStatus}
      aiSpeaking={!isMuted && speakerStatus === "AI speaking..."}
      onClose={onClose}
      onEnd={onEnd}
      onToggleMuted={() => {
        setIsMuted((current) => {
          const nextMuted = !current;
          if (!nextMuted) {
            setSpeakerStatus("Listening...");
          }
          return nextMuted;
        });
      }}
    />
  );
}

function LivePracticeLayout({
  scenario,
  pressure,
  personality,
  isMuted,
  speakerStatus,
  aiSpeaking,
  onClose,
  onEnd,
  onToggleMuted,
}: {
  scenario: Scenario;
  pressure: string;
  personality: string;
  isMuted: boolean;
  speakerStatus: SpeakerStatus;
  aiSpeaking: boolean;
  onClose: () => void;
  onEnd: () => void;
  onToggleMuted: () => void;
}) {
  return (
    <section className="max-h-[96vh] min-h-[86vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
      <CoachHeader
        scenario={scenario}
        pressure={pressure}
        personality={personality}
        onClose={onClose}
      />
      <div className="mt-5 grid gap-4 lg:min-h-[calc(86vh-9.5rem)] lg:grid-cols-[0.9fr_auto_1fr] lg:items-stretch">
        <div className="flex flex-col gap-4">
          <CoachVoicePanel
            scenario={scenario}
            isMuted={isMuted}
            speakerStatus={speakerStatus}
            aiSpeaking={aiSpeaking}
            onEnd={onEnd}
          />
        </div>
        <PracticeControls
          isMuted={isMuted}
          onToggleMuted={onToggleMuted}
        />
        <div className="flex flex-col gap-4">
          <GoalCard goal={scenario.goal} />
          <PracticeNotesPanel scenario={scenario} />
        </div>
      </div>
    </section>
  );
}

function CoachHeader({
  scenario,
  pressure,
  personality,
  onClose,
}: CoachModalProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-blue-950">
          {scenario.title}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
            {pressure}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            {personality}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
            {starterLabel(scenario.conversationStarter)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:justify-end">
        <StatusBadge />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close coach modal"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-950"
        >
          <CloseIcon />
        </button>
      </div>
    </header>
  );
}

function StatusBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
      </span>
      Live
    </div>
  );
}

function GoalCard({ goal }: { goal: string }) {
  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
        Goal
      </p>
      <p className="mt-2 text-sm leading-6 text-blue-950">{goal}</p>
    </section>
  );
}

function CoachVoicePanel({
  scenario,
  isMuted,
  speakerStatus,
  aiSpeaking,
  onEnd,
}: {
  scenario: Scenario;
  isMuted: boolean;
  speakerStatus: SpeakerStatus;
  aiSpeaking: boolean;
  onEnd: () => void;
}) {
  const role = roleLabels[scenario.iconName];

  return (
    <section className="flex flex-1 flex-col rounded-3xl border border-blue-100 bg-blue-50/70 p-5 text-center shadow-sm">
      <h3 className="text-2xl font-bold text-blue-950">{role}</h3>
      <div className="mt-6 flex flex-1 flex-col justify-center rounded-3xl border border-blue-100 bg-white px-5 py-7 shadow-sm">
        <AudioWaveform active={aiSpeaking} />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          {aiSpeaking ? "Voice output" : "Voice standby"}
        </p>
      </div>
      <p className="mt-5 text-lg font-bold text-blue-950">
        {isMuted ? "Muted" : speakerStatus}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        {starterCue(scenario.conversationStarter)}
      </p>
      <button
        type="button"
        onClick={onEnd}
        className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-rose-600 shadow-sm ring-1 ring-rose-100 transition hover:bg-rose-50"
      >
        <PhoneOffIcon />
        End Call
      </button>
    </section>
  );
}

function PracticeControls({
  isMuted,
  onToggleMuted,
}: {
  isMuted: boolean;
  onToggleMuted: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-2 lg:w-24 lg:px-1">
      <button
        type="button"
        onClick={onToggleMuted}
        aria-label={isMuted ? "Tap to speak" : "Tap to mute"}
        className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-xl transition ${
          isMuted
            ? "bg-slate-700 shadow-slate-700/25 hover:bg-slate-800"
            : "bg-blue-600 shadow-blue-600/25 hover:bg-blue-700"
        }`}
      >
        {isMuted ? <MicOffIcon /> : <MicIcon />}
      </button>
      <p className="text-center text-xs font-semibold text-slate-500">
        {isMuted ? "Tap to speak" : "Tap to mute"}
      </p>
    </div>
  );
}

function PracticeNotesPanel({ scenario }: { scenario: Scenario }) {
  return (
    <section className="flex min-h-[31rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
          Practice Notes
        </p>
        <h3 className="mt-2 text-xl font-bold text-blue-950">
          Conversation in progress
        </h3>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-blue-950">Tip</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {scenarioTips[scenario.iconName]}
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-950">After practice</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Feedback will be generated after practice. For now, you will see a
            polished mock feedback summary.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-bold text-blue-950">
            Background transcript
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            The conversation transcript is being saved in the agent logs for
            future feedback analysis.
          </p>
        </div>
      </div>

      <div className="mt-auto pt-5 text-sm leading-6 text-slate-500">
        Stay focused on speaking naturally. The coach will keep responses brief
        so you can practice the full situation.
      </div>
    </section>
  );
}

function FeedbackSummary({
  onClose,
  onTryAgain,
}: {
  onClose: () => void;
  onTryAgain: () => void;
}) {
  return (
    <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Feedback
          </p>
          <h2 className="mt-2 text-3xl font-black text-blue-950">
            Practice Complete
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close feedback"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-950"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
              Overall Score
            </p>
            <p className="mt-1 text-5xl font-black text-blue-950">84/100</p>
          </div>
          <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
            Strong attempt
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <FeedbackBlock
          title="What went well"
          text="You asked for help clearly."
        />
        <FeedbackBlock
          title="What to improve"
          text="Try using a more natural opening phrase."
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
          <h3 className="font-bold text-blue-950">Better phrasing</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Instead of
              </p>
              <p className="mt-2 text-slate-600">&quot;Where notebooks?&quot;</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                Try
              </p>
              <p className="mt-2 text-blue-950">
                &quot;Excuse me, where can I find notebooks?&quot;
              </p>
            </div>
          </div>
        </div>
        <FeedbackBlock
          title="Cultural/social tip"
          text="In U.S. stores, it is common to politely ask employees directly for help."
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Back to Scenario
        </button>
        <button
          type="button"
          onClick={onTryAgain}
          className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </section>
  );
}

function FeedbackBlock({
  title,
  text,
  className = "",
}: {
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="font-bold text-blue-950">{title}</h3>
      <p className="mt-2 leading-7 text-slate-600">{text}</p>
    </div>
  );
}

function LoadingCard({
  scenario,
  onClose,
}: {
  scenario: Scenario;
  onClose: () => void;
}) {
  return (
    <section className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
      <FloatingCloseButton onClose={onClose} label="Close loading modal" />
      <LoadingIndicator />
      <h2 className="mt-6 text-2xl font-bold text-blue-950">
        AI Coach Starting...
      </h2>
      <p className="mt-3 leading-7 text-slate-500">
        Setting up your live roleplay practice.
      </p>
      <p className="mt-4 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
        Scenario: {scenario.title}
      </p>
    </section>
  );
}

function ErrorCard({
  message,
  onRetry,
  onUseMock,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onUseMock: () => void;
  onClose: () => void;
}) {
  return (
    <section className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
      <FloatingCloseButton onClose={onClose} label="Close error modal" />
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <WarningIcon />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-blue-950">
        Could not start voice practice
      </h2>
      <p className="mt-3 leading-7 text-slate-500">{message}</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onUseMock}
          className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Use Mock
        </button>
      </div>
    </section>
  );
}

function ProcessingCard({ onClose }: { onClose: () => void }) {
  return (
    <section className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
      <FloatingCloseButton onClose={onClose} label="Close processing modal" />
      <LoadingIndicator />
      <h2 className="mt-6 text-2xl font-bold text-blue-950">
        Generating Feedback...
      </h2>
      <p className="mt-3 leading-7 text-slate-500">
        Reviewing your clarity, confidence, and natural phrasing.
      </p>
    </section>
  );
}

function FloatingCloseButton({
  onClose,
  label,
}: {
  onClose: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-950"
    >
      <CloseIcon />
    </button>
  );
}

function LoadingIndicator() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
      <span className="h-4 w-4 animate-ping rounded-full bg-blue-600" />
    </div>
  );
}

function AudioWaveform({ active }: { active: boolean }) {
  return (
    <div className="mt-5 flex h-10 items-end justify-center gap-1.5">
      {[18, 28, 38, 24, 32, 20, 34].map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={`w-2 rounded-full bg-blue-500 ${
            active ? "animate-pulse" : "opacity-30"
          }`}
          style={{
            height,
            animationDelay: `${index * 120}ms`,
          }}
        />
      ))}
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
      viewBox="0 0 24 24"
    >
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
      viewBox="0 0 24 24"
    >
      <path d="m2 2 20 20" />
      <path d="M9 9v3a3 3 0 0 0 5.1 2.1" />
      <path d="M15 9.34V6a3 3 0 0 0-5.68-1.33" />
      <path d="M19 10v2a7 7 0 0 1-.7 3" />
      <path d="M5 10v2a7 7 0 0 0 10.7 5.95" />
      <path d="M12 19v3" />
    </svg>
  );
}

function PhoneOffIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
      viewBox="0 0 24 24"
    >
      <path d="m2 2 20 20" />
      <path d="M9.5 6.5 8.4 3.7A2 2 0 0 0 6.5 2.5H4.7A2.2 2.2 0 0 0 2.5 4.8C2.9 14 10 21.1 19.2 21.5a2.2 2.2 0 0 0 2.3-2.2v-1.8a2 2 0 0 0-1.2-1.9l-2.8-1.1" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
      viewBox="0 0 24 24"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
      viewBox="0 0 24 24"
    >
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
      viewBox="0 0 24 24"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
