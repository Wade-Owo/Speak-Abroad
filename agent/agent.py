import asyncio
import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    AgentServer,
    JobContext,
    JobProcess,
    cli,
)
from livekit.plugins import google, silero
from google import genai
from google.genai import types
import requests

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env.local")

if not os.environ.get("LIVEKIT_URL") and os.environ.get("NEXT_PUBLIC_LIVEKIT_URL"):
    os.environ["LIVEKIT_URL"] = os.environ["NEXT_PUBLIC_LIVEKIT_URL"]

DEBUG_SYSTEM_EVENTS = os.getenv("DEBUG_SYSTEM_EVENTS") == "true"


def prewarm(proc: JobProcess):
    print(">>> Prewarming Silero VAD")
    proc.userdata["vad"] = silero.VAD.load(
        min_speech_duration=0.1,
        min_silence_duration=0.5,
        prefix_padding_duration=0.2,
    )


server = AgentServer(setup_fnc=prewarm)


def extract_text(content) -> str:
    """Extracts text from various content formats, including Gemini Realtime Parts."""
    if isinstance(content, list):
        parts = []
        for part in content:
            if hasattr(part, "text") and part.text:
                parts.append(part.text)
            elif isinstance(part, str):
                parts.append(part)
        return " ".join(parts).strip()

    if isinstance(content, str):
        return content.strip()

    return ""


def normalize_role(role: str) -> str | None:
    if role in ["assistant", "model"]:
        return "assistant"
    if role == "user":
        return "user"
    return None


def user_requested_end(text: str) -> bool:
    normalized = text.lower().strip()
    end_phrases = [
        "bye", "goodbye", "thank you", "thanks", 
        "that's all", "i'm done", "done"
    ]
    return any(phrase in normalized for phrase in end_phrases)


def assistant_completed_practice(text: str) -> bool:
    normalized = text.lower().strip()
    return (
        "great, you completed the practice" in normalized or 
        "goodbye" in normalized
    )


@server.rtc_session()
async def entrypoint(ctx: JobContext):
    await ctx.connect()

    participant = await ctx.wait_for_participant()
    print(f">>> Participant connected: {participant.identity}")

    settings = json.loads(participant.metadata or "{}")
    pressure = settings.get("pressure", "Normal")
    personality = settings.get("personality", "Friendly")
    scenario_title = settings.get("scenarioTitle", "Real-life conversation")
    scenario_description = settings.get("scenarioDescription", "")
    goal = settings.get("goal", "")
    detailed_goal = settings.get("detailedGoal", "")
    success_criteria = settings.get("successCriteria", [])
    role = settings.get("role", "conversation partner")
    conversation_starter = settings.get("conversationStarter", "ai")
    
    if conversation_starter not in ["ai", "user"]:
        conversation_starter = "ai"

    if conversation_starter == "user":
        opening_line = "Wait silently for the student to speak first. Then respond naturally."
    else:
        opening_line = "Start immediately with one natural opening line."

    if conversation_starter == "ai" and role.lower() == "cashier":
        opening_line = 'Start by saying: "Hi! Welcome in. What are you looking for today?"'

    print(f">>> Scenario loaded: {scenario_title} | Role: {role}")

    system_instruction = (
        f"You are the {role} in '{scenario_title}'.\n"
        f"Description: {scenario_description}\n"
        f"Detailed Goal: {detailed_goal}\n"
        f"Success Criteria: {', '.join(success_criteria)}\n"
        f"Personality: {personality} | Pressure: {pressure}\n"
        f"Opening: {opening_line}\n\n"
        "Rules:\n"
        "- Stay in character. Keep responses under 12 words.\n"
        "- Ask only one question at a time.\n"
        "- Do not coach or correct the user during roleplay.\n"
        "- When finished, say exactly: 'Great, you completed the practice. Goodbye.'"
    )

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            voice="Aoede", 
            temperature=0.4,
            instructions=system_instruction
        ),
        vad=ctx.proc.userdata["vad"],
    )

    agent = Agent(instructions=system_instruction)

    transcript = []
    assistant_turns = 0
    user_has_spoken = False
    end_practice_task = None

    async def end_practice_after_delay(reason: str, delay: float):
        await asyncio.sleep(delay)
        print(f">>> Auto-ending practice: {reason}")
        ctx.shutdown(reason=reason)

    def schedule_practice_end(reason: str, delay: float = 2.0):
        nonlocal end_practice_task
        if end_practice_task is not None and not end_practice_task.done():
            return
        end_practice_task = asyncio.create_task(end_practice_after_delay(reason, delay))

    @session.on("conversation_item_added")
    def on_item_added(event):
        nonlocal assistant_turns, user_has_spoken
        item = event.item
        role_name = normalize_role(getattr(item, "role", "unknown"))

        if role_name is None: return

        text = extract_text(getattr(item, "content", ""))
        if not text: return

        transcript.append({"role": role_name, "text": text})

        if role_name == "assistant":
            assistant_turns += 1
            print(f">>> [assistant] {text}")
            if user_has_spoken and assistant_completed_practice(text):
                schedule_practice_end("scenario complete", delay=1.5)
        else:
            user_has_spoken = True
            print(f">>> [user] {text}")
            if user_requested_end(text):
                schedule_practice_end("user requested ending", delay=0.1)

    await session.start(agent=agent, room=ctx.room)

    if conversation_starter == "ai":
        await session.generate_reply()

    try:
        while participant.identity in ctx.room.remote_participants:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass
    finally:
        if end_practice_task is not None and not end_practice_task.done():
            end_practice_task.cancel()

        await asyncio.sleep(0.5)
        
        if transcript:
            print(">>> Generating AI Feedback...")
            # Set http_options to use the stable v1 API version
            client = genai.Client(
                api_key=os.environ.get("GOOGLE_API_KEY"),
                http_options=types.HttpOptions(api_version='v1')
            )
            
            prompt = f"Analyze this roleplay transcript for '{scenario_title}': {json.dumps(transcript)}"

            try:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction="Analyze the transcript. Return JSON: score, wentWell, toImprove, insteadOf, tryThis, culturalTip.",
                        response_mime_type="application/json",
                    ),
                )
                
                feedback_data = response.parsed
                feedback_data["roomName"] = ctx.room.name
                
                api_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
                requests.post(f"{api_url}/api/feedback", json=feedback_data)
                print(">>> Feedback sent successfully.")
            except Exception as e:
                print(f">>> Feedback Error: {e}")

        ctx.shutdown(reason="session ended")

if __name__ == "__main__":
    cli.run_app(server)