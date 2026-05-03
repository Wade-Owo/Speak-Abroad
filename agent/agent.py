import asyncio
import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from livekit import api
from livekit.agents import (
    Agent,
    AgentSession,
    AgentServer,
    JobContext,
    JobProcess,
    cli,
    function_tool,
    get_job_context,
)
from livekit.plugins import google, silero
import requests

try:
    from livekit.agents.beta.tools import EndCallTool
except ImportError:
    EndCallTool = None

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env.local")

if not os.environ.get("LIVEKIT_URL") and os.environ.get("NEXT_PUBLIC_LIVEKIT_URL"):
    os.environ["LIVEKIT_URL"] = os.environ["NEXT_PUBLIC_LIVEKIT_URL"]

DEBUG_SYSTEM_EVENTS = os.getenv("DEBUG_SYSTEM_EVENTS") == "true"


def prewarm(proc: JobProcess):
    print(">>> Prewarming Silero VAD")
    proc.userdata["vad"] = silero.VAD.load(
        min_speech_duration=0.05,
        min_silence_duration=0.35,
        prefix_padding_duration=0.2,
    )


server = AgentServer(setup_fnc=prewarm)


def extract_text(content) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif hasattr(part, "text") and part.text:
                parts.append(part.text)
            elif hasattr(part, "text_content") and part.text_content:
                parts.append(part.text_content)
        return " ".join(parts).strip()

    if hasattr(content, "text") and content.text:
        return content.text.strip()

    if hasattr(content, "text_content") and content.text_content:
        return content.text_content.strip()

    return ""


def normalize_role(role: str) -> str | None:
    if role in ["assistant", "model"]:
        return "assistant"
    if role == "user":
        return "user"
    return None


def create_end_call_tools(session: AgentSession):
    extra_description = (
        "Use this tool when the roleplay is complete, when the user says goodbye, "
        "or when the scenario goal has been satisfied. Do not call it immediately "
        "after the opening line. Do not call it before the user has responded at "
        "least once unless the user explicitly asks to stop."
    )
    end_instructions = (
        "Briefly say the practice is complete and goodbye in one short sentence."
    )

    if EndCallTool is not None:
        return EndCallTool(
            delete_room=True,
            extra_description=extra_description,
            end_instructions=end_instructions,
        ).tools

    @function_tool(
        name="end_practice",
        description=extra_description,
    )
    async def end_practice() -> str:
        """End the current LiveKit practice room."""
        job_ctx = get_job_context(required=False)
        if job_ctx is None:
            return "No active LiveKit job context."

        wait_for_inactive = getattr(session, "wait_for_inactive", None)
        if wait_for_inactive is not None:
            await wait_for_inactive()

        await job_ctx.api.room.delete_room(
            api.DeleteRoomRequest(room=job_ctx.room.name)
        )
        return "Practice ended."

    return [end_practice]

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
    role = settings.get("role", "conversation partner")
    conversation_starter = settings.get("conversationStarter", "ai")
    if conversation_starter not in ["ai", "user"]:
        conversation_starter = "ai"

    if conversation_starter == "user":
        opening_line = (
            "The student must start this conversation. Do not speak first. "
            "Wait silently for the student's first message. After the student "
            "speaks, respond naturally as the role."
        )
    else:
        opening_line = "Start the conversation immediately with one natural opening line."

    if conversation_starter == "ai" and role.lower() == "cashier":
        opening_line = 'Start immediately by saying: "Hi! Welcome in. What are you looking for today?"'
    end_call_tool_name = "end_call" if EndCallTool is not None else "end_practice"

    print(
        ">>> Scenario metadata loaded: "
        f"scenario='{scenario_title}', role='{role}', pressure='{pressure}', "
        f"personality='{personality}', conversationStarter='{conversation_starter}'"
    )

    system_instruction = (
        f"You are the {role} in a spoken roleplay scenario called '{scenario_title}'.\n"
        f"Scenario description: {scenario_description}\n"
        f"Student goal: {goal}\n"
        f"Your personality: {personality}\n"
        f"Pressure level: {pressure}\n"
        f"Opening behavior: {opening_line}\n\n"
        "Strict rules:\n"
        "- Stay fully in character as the role.\n"
        "- Keep every response short, natural, and realistic.\n"
        "- Respond in one sentence unless clarification is necessary.\n"
        "- Keep replies under 12 words when possible.\n"
        "- Ask only one question at a time.\n"
        "- Do not coach, grade, explain, or correct during the roleplay.\n"
        "- If the student is unclear, ask a simple clarification.\n"
        "- If pressure is High Pressure, sound slightly rushed but not rude.\n"
        "- If personality is Impatient, be brief and direct but still appropriate.\n"
        f"- If the user clearly says bye, goodbye, thanks, thank you, that’s all, I’m done, or similar, call the {end_call_tool_name} tool after a short goodbye.\n"
        f"- If the scenario goal is completed, call the {end_call_tool_name} tool after a short closing line.\n"
        "- If you reach 10 assistant turns, guide the user to finish and then end the call.\n"
        "- Never leave the user waiting after the scenario is complete.\n"
        f"- Do not call {end_call_tool_name} before the user has responded at least once, unless the user explicitly asks to stop.\n"
        "- When complete, say exactly: “Great, you completed the practice. Goodbye.”"
    )

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            voice="Aoede", 
            temperature=0.4,
            instructions=system_instruction
        ),
        vad=ctx.proc.userdata["vad"],
    )

    agent = Agent(
        instructions=system_instruction,
        tools=create_end_call_tools(session),
    )

    transcript = []
    assistant_turns = 0

    @session.on("conversation_item_added")
    def on_item_added(event):
        nonlocal assistant_turns

        item = event.item
        item_role = getattr(item, "role", "unknown")
        role_name = normalize_role(item_role)

        if role_name is None:
            if DEBUG_SYSTEM_EVENTS:
                print(f">>> SYSTEM EVENT: {type(item).__name__}")
            return

        text = extract_text(getattr(item, "content", ""))

        if not text:
            return

        transcript.append({"role": role_name, "text": text})

        if role_name == "assistant":
            assistant_turns += 1
            print(f">>> [assistant] {text} (turn {assistant_turns})")
        else:
            print(f">>> [user] {text}")

        if DEBUG_SYSTEM_EVENTS:
            print(f">>> SYSTEM EVENT: {type(item).__name__}")

    session_start = time.perf_counter()
    await session.start(agent=agent, room=ctx.room)
    print(f">>> Session started in {time.perf_counter() - session_start:.2f}s")

    if conversation_starter == "ai":
        opening_start = time.perf_counter()
        await session.generate_reply()
        print(f">>> Opening reply generated in {time.perf_counter() - opening_start:.2f}s")
    else:
        print(">>> Waiting for user to start the conversation")

    try:
        while participant.identity in ctx.room.remote_participants:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass
    finally:
        flush_delay = 3 if os.getenv("DEBUG_TRANSCRIPT_FLUSH") == "true" else 0.5
        await asyncio.sleep(flush_delay)
        
        print("\n" + "="*50)
        print("📜 FINAL SCENARIO TRANSCRIPT")
        if transcript:
            # Analyze and Send Feedback
            # In production, call an LLM here to generate these strings from the transcript
            feedback_data = {
                "roomName": ctx.room.name,
                "score": 88, # Example score from analysis
                "wentWell": "You clearly stated your goal at the start.",
                "toImprove": "Try using more polite fillers like 'Um' or 'Excuse me'.",
                "insteadOf": transcript[1]['text'] if len(transcript) > 1 else "...",
                "tryThis": "Could you please help me with...",
                "culturalTip": "In this setting, directness is valued but formal greetings are expected."
            }

            try:
                # Send to the Next.js API
                api_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
                requests.post(f"{api_url}/api/feedback", json=feedback_data)
            except Exception as e:
                print(f">>> Failed to send feedback: {e}")

        print(json.dumps(transcript, indent=2))
        print("="*50 + "\n")

if __name__ == "__main__":
    cli.run_app(server)
