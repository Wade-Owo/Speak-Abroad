// app/api/feedback/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Temporary in-memory storage
const feedbackStore = new Map();

export async function POST(req: Request) {
  const data = await req.json();
  if (!data?.roomName) {
    return NextResponse.json(
      { error: "Missing roomName for feedback" },
      { status: 400 },
    );
  }

  feedbackStore.set(data.roomName, data);
  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomName = searchParams.get("roomName");
  if (!roomName) {
    return NextResponse.json(null, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const feedback = feedbackStore.get(roomName);
  return NextResponse.json(feedback || null, {
    headers: { "Cache-Control": "no-store" },
  });
}
