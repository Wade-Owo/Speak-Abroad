// app/api/feedback/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const data = await req.json();
  if (!data?.roomName) {
    return NextResponse.json({ error: "Missing roomName" }, { status: 400 });
  }

  try {
    // Save to the "feedback" collection using roomName as the unique document ID
    await setDoc(doc(db, "feedback", data.roomName), {
      ...data,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Firestore POST error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomName = searchParams.get("roomName");
  
  if (!roomName) {
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    // Read directly from Firestore so it survives hot-reloads and server restarts
    const docSnap = await getDoc(doc(db, "feedback", roomName));
    
    if (docSnap.exists()) {
      return NextResponse.json(docSnap.data(), { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Firestore GET error:", error);
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } });
  }
}