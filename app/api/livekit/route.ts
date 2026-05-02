import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room');
  const pressure = searchParams.get('pressure') || 'Normal';
  const personality = searchParams.get('personality') || 'Friendly';
  const participantName = `student-${Math.floor(Math.random() * 1000)}`;

  if (!room) {
    return NextResponse.json({ error: 'Missing room identifier' }, { status: 400 });
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY, 
    process.env.LIVEKIT_API_SECRET, 
    { 
      identity: participantName,
      // We pass the scenario context directly into the token metadata
      metadata: JSON.stringify({ pressure, personality }) 
    }
  );

  at.addGrant({ roomJoin: true, room: room });

  return NextResponse.json({ token: await at.toJwt() });
}