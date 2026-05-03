// app/api/feedback/route.ts
import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
// IMPORTANT: Notice the "/lite" at the end of this import!
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore/lite";

export const dynamic = "force-dynamic";

// Initialize the Firebase app locally for the server environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the LITE version of the database to prevent gRPC Serverless crashes
const dbLite = getFirestore(app);

export async function POST(req: Request) {
  const data = await req.json();
  if (!data?.roomName) {
    return NextResponse.json({ error: "Missing roomName" }, { status: 400 });
  }

  try {
    await setDoc(doc(dbLite, "feedback", data.roomName), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Firestore POST error:", error);
    return NextResponse.json({ error: "Failed to save to database" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomName = searchParams.get("roomName");
  
  if (!roomName) {
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const docSnap = await getDoc(doc(dbLite, "feedback", roomName));
    if (docSnap.exists()) {
      return NextResponse.json(docSnap.data(), { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Firestore GET error:", error);
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } });
  }
}