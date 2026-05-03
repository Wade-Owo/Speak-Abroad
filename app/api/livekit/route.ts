import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getScenarioById, type Scenario } from "../../data/scenarios";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scenarioId = searchParams.get("scenarioId") || searchParams.get("room");
  const pressure = searchParams.get("pressure") || "Normal";
  const personality = searchParams.get("personality") || "Friendly";
  const participantName = `student-${Math.floor(Math.random() * 1000)}`;

  if (!scenarioId) {
    return NextResponse.json(
      { error: "Missing scenario identifier" },
      { status: 400 },
    );
  }

  const scenario = getScenarioById(scenarioId);

  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !serverUrl) {
    return NextResponse.json(
      { error: "LiveKit environment variables are not configured" },
      { status: 500 },
    );
  }

  const roomName = `scenario-${scenario.id}-${crypto.randomUUID()}`;
  const metadata = {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    scenarioDescription: scenario.description,
    goal: scenario.goal,
    detailedGoal: scenario.detailedGoal,
    successCriteria: scenario.successCriteria,
    role: roleLabels[scenario.iconName],
    conversationStarter: scenario.conversationStarter,
    pressure,
    personality,
  };

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    metadata: JSON.stringify(metadata),
  });

  at.addGrant({ roomJoin: true, room: roomName });

  return NextResponse.json({
    token: await at.toJwt(),
    serverUrl,
    roomName,
  });
}
