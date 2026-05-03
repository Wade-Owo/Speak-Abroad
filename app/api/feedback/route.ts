// app/api/feedback/route.ts
import { NextResponse } from "next/server";

// Temporary in-memory storage
const feedbackStore = new Map();

export async function POST(req: Request) {
  const data = await req.json();
  feedbackStore.set(data.roomName, data);
  return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomName = searchParams.get("roomName");
  const feedback = feedbackStore.get(roomName);
  return NextResponse.json(feedback || null);
}