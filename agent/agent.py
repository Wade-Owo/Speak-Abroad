import asyncio
import json
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    AgentServer,
    JobContext,
    cli,
    llm
)
from livekit.plugins import google, silero

load_dotenv()

server = AgentServer()

@server.rtc_session()
async def entrypoint(ctx: JobContext):
    await ctx.connect()

    participant = await ctx.wait_for_participant()
    settings = json.loads(participant.metadata or "{}")
    pressure = settings.get("pressure", "Normal")
    personality = settings.get("personality", "Friendly")

    system_instruction = (
        f"You are participating in a college campus simulation. "
        f"Your personality is: {personality}. The current situation pressure is: {pressure}. "
        "Keep responses conversational and very brief."
    )

    # 1. Initialize the Session - passing instructions to the MODEL
    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            voice="Aoede", 
            temperature=0.8,
            instructions=system_instruction
        ),
        vad=silero.VAD.load(),
    )

    # 2. Initialize the Agent - passing instructions to the AGENT (Required by SDK)
    agent = Agent(instructions=system_instruction)

    # 3. THE CATCH-ALL TRANSCRIPT CAPTURE
    transcript = []

    @session.on("conversation_item_added")
    def on_item_added(event):
        # Log the raw event for debugging
        item = event.item
        role = getattr(item, "role", "unknown")
        
        # If it's a message from the user or the AI
        if role in ["user", "assistant", "model"]:
            content = getattr(item, "content", "")
            text = ""
            
            if isinstance(content, str):
                text = content
            elif isinstance(content, list):
                # Robust extraction: try .text, .text_content, or string conversion
                parts = []
                for p in content:
                    if hasattr(p, "text") and p.text:
                        parts.append(p.text)
                    elif hasattr(p, "text_content") and p.text_content:
                        parts.append(p.text_content)
                    elif isinstance(p, str):
                        parts.append(p)
                text = " ".join(parts)

            if text.strip():
                # Map 'model' to 'assistant' for your UI
                role_name = "assistant" if role == "model" else role
                print(f">>> DATA CAPTURED: [{role_name}] {text}")
                transcript.append({"role": role_name, "text": text.strip()})
        else:
            # This logs things like 'AgentHandoff' so we know the listener is alive
            print(f">>> SYSTEM EVENT: {type(item).__name__}")

    # 4. Start the Session
    await session.start(agent=agent, room=ctx.room)
    await asyncio.sleep(2) 

    # Trigger the AI's opening line
    await session.generate_reply()

    try:
        while participant.identity in ctx.room.remote_participants:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass
    finally:
        # Give the background event loop 3 seconds to flush the Gemini buffer
        await asyncio.sleep(3)
        
        print("\n" + "="*50)
        print("📜 FINAL SCENARIO TRANSCRIPT")
        print("="*50)
        if not transcript:
            print("(!) EMPTY TRANSCRIPT: No speech-to-text matches found.")
            print("Check if 'DATA CAPTURED' appeared in the logs during the call.")
        else:
            print(json.dumps(transcript, indent=2))
        print("="*50 + "\n")

if __name__ == "__main__":
    cli.run_app(server)