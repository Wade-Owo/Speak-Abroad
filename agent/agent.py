import asyncio
import json
import os
import re
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
        min_speech_duration=0.05,
        min_silence_duration=0.30,
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
        "that's all", "that is all", "i'm done", "im done", "i am done",
        "done", "stop", "end scenario", "end practice"
    ]
    return any(phrase in normalized for phrase in end_phrases)


def assistant_completed_practice(text: str) -> bool:
    normalized = text.lower().strip()
    return (
        "great, you completed the practice" in normalized or 
        "goodbye" in normalized
    )


def extract_json_object(text: str) -> dict | None:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def first_user_text(transcript: list[dict]) -> str:
    for item in transcript:
        if item["role"] == "user":
            return item["text"]
    return "..."


def build_fallback_feedback(transcript: list[dict], scenario_title: str) -> dict:
    user_turns = [item["text"] for item in transcript if item["role"] == "user"]
    assistant_turns = [item["text"] for item in transcript if item["role"] == "assistant"]
    score = 72

    if len(user_turns) >= 3:
        score += 6
    if any(len(turn.split()) >= 6 for turn in user_turns):
        score += 5
    if any("?" in turn for turn in user_turns):
        score += 4
    if any("please" in turn.lower() or "thank" in turn.lower() for turn in user_turns):
        score += 3

    score = min(score, 88)

    return {
        "score": score,
        "wentWell": "You kept the conversation moving and responded to follow-up questions.",
        "toImprove": "Your request was hard to follow at first. State the key details in a simple order.",
        "insteadOf": first_user_text(transcript),
        "tryThis": "Hi, I'd like to make a reservation for tomorrow at 2 PM for two people.",
        "culturalTip": (
            f"In a {scenario_title.lower()} scenario, lead with the practical details first, "
            "then confirm them clearly."
        ),
    }


def normalize_feedback(candidate: dict | None, transcript: list[dict], scenario_title: str) -> dict:
    fallback = build_fallback_feedback(transcript, scenario_title)
    if not isinstance(candidate, dict):
        return fallback

    feedback = {}
    for key, value in fallback.items():
        feedback[key] = candidate.get(key, value)

    try:
        feedback["score"] = max(0, min(100, int(feedback["score"])))
    except (TypeError, ValueError):
        feedback["score"] = fallback["score"]

    for key in ["wentWell", "toImprove", "insteadOf", "tryThis", "culturalTip"]:
        if not isinstance(feedback[key], str) or not feedback[key].strip():
            feedback[key] = fallback[key]
        else:
            feedback[key] = feedback[key].strip()

    return feedback

def generate_feedback(transcript: list[dict], scenario_title: str, goal: str) -> dict:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print(">>> GOOGLE_API_KEY missing; using fallback feedback.")
        return build_fallback_feedback(transcript, scenario_title)

    # You can explicitly force the stable v1 API version if v1beta continues to cause issues
    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(api_version='v1') 
    )
    
    prompt = (
        "You are evaluating a spoken English roleplay for SpeakAbroad.\n"
        "Return only valid JSON with exactly these keys:\n"
        '{ "score": number, "wentWell": string, "toImprove": string, '
        '"insteadOf": string, "tryThis": string, "culturalTip": string }\n'
        f"Scenario: {scenario_title}\n"
        f"Goal: {goal}\n"
        f"Transcript JSON: {json.dumps(transcript)}"
    )

    # USE THE MODEL SPECIFIED IN YOUR PROJECT DOCS
    model_name = os.getenv("FEEDBACK_MODEL", "gemini-2.5-flash")

    for attempt in range(3):
        try:
            print(f">>> Generating AI Feedback with {model_name} (Attempt {attempt + 1})...")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=600,
                ),
            )
            parsed = extract_json_object(response.text or "")
            return normalize_feedback(parsed, transcript, scenario_title)
            
        except Exception as error:
            if "429" in str(error) and attempt < 2:
                print(f">>> Quota hit. Retrying in 8 seconds... (Attempt {attempt + 1}/3)")
                time.sleep(8)
                continue
                
            print(f">>> Feedback Error: {error}")
            print(">>> Using fallback feedback so the UI still receives results.")
            return build_fallback_feedback(transcript, scenario_title)


@server.rtc_session()
async def entrypoint(ctx: JobContext):
    await ctx.connect()

    participant = await ctx.wait_for_participant()
    print(f">>> Participant connected: {participant.identity}")

    settings = json.loads(participant.metadata or "{}")
    user_id = settings.get("userId", "anonymous")
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
        aec_warmup_duration=0.5,
    )

    agent = Agent(instructions=system_instruction)

    transcript = []
    assistant_turns = 0
    user_has_spoken = False
    end_practice_task = None

    async def end_practice_after_delay(reason: str, delay: float):
        await asyncio.sleep(delay)
        print(f">>> Auto-ending practice: {reason}")
        # REMOVE: await ctx.delete_room() 
        # Using shutdown avoids the WebRTC ParseIntError panic on Windows
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
            elif user_has_spoken and assistant_turns >= 10:
                schedule_practice_end("maximum assistant turns reached", delay=1.5)
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
            feedback_data = generate_feedback(transcript, scenario_title, detailed_goal or goal)
            feedback_data["roomName"] = ctx.room.name
            feedback_data["userId"] = user_id

            try:
                api_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
                response = requests.post(
                    f"{api_url}/api/feedback",
                    json=feedback_data,
                    timeout=15,
                )
                response.raise_for_status()
                print(">>> Feedback sent successfully.")
            except Exception as e:
                print(f">>> Failed to send feedback: {e}")

        ctx.shutdown(reason="session ended")

if __name__ == "__main__":
    cli.run_app(server)
