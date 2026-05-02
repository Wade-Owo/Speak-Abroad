import asyncio
import json
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    AgentServer,
    JobContext,
    cli
)
from livekit.plugins import google, silero

load_dotenv()

server = AgentServer()

@server.rtc_session()
async def entrypoint(ctx: JobContext):
    # Connect the server worker to the room
    await ctx.connect()

    # Wait for the student to join the room and extract their UI settings
    participant = await ctx.wait_for_participant()
    settings = json.loads(participant.metadata or "{}")
    pressure = settings.get("pressure", "Normal")
    personality = settings.get("personality", "Friendly")

    system_instruction = (
        f"You are participating in a college campus simulation. "
        f"Your personality is: {personality}. The current situation pressure is: {pressure}. "
        "Keep responses conversational, use realistic pacing, and match the pressure level of the scenario. "
        "You are having a spoken voice conversation. Keep your answers brief."
    )

    # Initialize the unified session, but pass it the Gemini Realtime model
    # This bypasses STT/TTS entirely and streams audio directly via WebSocket!
    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            voice="Aoede", # Gemini voice options: Puck, Charon, Kore, Fenrir, Aoede
            temperature=0.8,
        ),
        vad=silero.VAD.load(),
    )

    agent = Agent(instructions=system_instruction)

    # Start the session and automatically bind it to the WebRTC room
    await session.start(agent=agent, room=ctx.room)

    # Give the browser time to mount the audio renderer
    await asyncio.sleep(1.5)

    # Trigger the AI's opening line seamlessly
    if pressure == "High Pressure":
        await session.generate_reply(instructions="Say exactly this: 'Hey, hurry up! We don't have much time, what's going on?'")
    else:
        await session.generate_reply(instructions="Say exactly this: 'Hey there. How can I help you out today?'")

if __name__ == "__main__":
    cli.run_app(server)