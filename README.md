# SpeakAbroad

**SpeakAbroad** is an AI-powered conversational practice platform designed to help international students build confidence by simulating real-life scenarios in an interactive, safe environment.

## Inspiration (The Problem & Solution)
Most language apps focus on grammar and vocabulary. But for international students, the harder part is often cultural: knowing when to speak first, how directly to ask for help, how to respond under pressure, and what tone feels appropriate in a new environment.

We frame this through the cultural sensitivity spectrum. Students are not just learning words — they are moving from cultural uncertainty, to cultural awareness, to cultural confidence.

SpeakAbroad helps that growth happen safely. Before each roleplay, the app explains the scenario, the goal, and who should start the conversation. Then students practice with an AI roleplay partner and build confidence handling real situations like office hours, grocery stores, roommate conversations, and job interviews.

## Core Features
* **Scenario-Based Practice:** Practice real-life college scenarios that mimic realistic pacing, context, and social expectations. 
* **Pressure Mode:** An adaptable setting that changes the environment of the conversation (e.g., placing the student under time pressure) to test their fluency in stressful situations.
* **AI-Powered Voice Conversations:** Students interact through natural speech using persona-based agents, making the practice feel like a genuine FaceTime or Zoom call.
* **Instant, Actionable Feedback:** After each session, users receive constructive feedback on their speaking clarity, response pacing, and specific areas for improvement to help track their progress over time.

## How We Built It (Tech Stack)
* **Frontend:** Next.js (Responsive UI and fast interaction)
* **Live AI Conversation:** Gemini Live API (Low-latency voice interactions)
* **Voice/Session Orchestration:** LiveKit Agents (Real-time voice agent management)
* **Transcript Logging:** Gemini Live Transcription (Ensures clean, isolated text rather than attempting to transcribe a mixed audio recording after the fact)
* **Feedback Engine:** Gemini 2.5 Flash text model (Parses the transcript to generate scores and coaching tips)
* **Database:** Firebase Firestore (Saving user scores and historical feedback)
* **Team Infrastructure:** GitHub (Version control & workflow) and Discord (Team sync)

## Challenges We Ran Into
* **WebRTC Thread Panics:** Force-closing rooms caused native thread panics on Windows. We had to engineer graceful shutdown handshakes between the browser and the Python worker.
* **API Rate Limiting:** Hitting the Gemini Free Tier limits broke our app early on. We solved this by building resilient fallback mechanisms and "Mock Modes" so the UI never crashes for the user.
* **Serverless Database Timeouts:** Next.js aggressively blocked Firebase’s live gRPC WebSocket connections, causing 30-second hangs. We overcame this by migrating to the REST-based Firestore Lite SDK.
* **Complex Orchestration:** Syncing LiveKit token generation, port management, and room assignments between a Next.js frontend and a local Python worker required strict environment management.

## Accomplishments We Are Proud Of
* Successfully integrated the Gemini Live API with LiveKit to achieve a highly responsive, interrupting-capable conversational partner.
* Built a seamless data loop that translates raw audio into structured transcripts, passing them to Gemini 2.5 Flash for personalized scoring and cultural tips.
* Engineered graceful degradations so the student's practice session never abruptly crashes, even if backend APIs fail.
* Successfully unified a Next.js App Router frontend, a Python voice orchestration layer, and a secure Firebase database into one cohesive product.

## What We Learned
* **Multi-Modal Prompt Engineering:** Prompting an AI to hold a natural, spoken conversation requires entirely different constraints than prompting an AI to extract and analyze JSON data.
* **Version Control Communication:** It is incredibly important to actively notify teammates of commit pushes to reduce the risk of merge conflicts and breaking the application state.

## What’s Next for SpeakAbroad?
* **Visual Avatars:** Integrate the Simli SDK to replace the audio waveform with a realistic, lip-synced talking face.
* **Global Expansion:** Add region settings to dynamically adjust LiveKit voice accents and tailor the AI's cultural feedback to different countries (currently restricted to the U.S.).
* **Career-Readiness Module:** Introduce high-stakes professional scenarios like job interviews, offer negotiations, and workplace communication.
* **Progress Dashboard:** Fully utilize our Firebase data to build a personalized dashboard charting a student's confidence scores and common language hurdles over time.

## The Team
Built by **Anthony Silva**, **Wade Owojori**, and **Kausar Moshood** *Oregon State University*