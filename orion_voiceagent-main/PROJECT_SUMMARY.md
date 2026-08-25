# Project Summary: Vaani WebRTC Real-Time Voice Sidecar

### Track: Razorpay AI Buildathon — Track 04: AI Finance Controller
### Role: Ultra-low-latency real-time voice streaming sidecar for financial operations.

---

## 🌟 Overview
This subsystem provides an end-to-end **WebRTC real-time voice channel** for merchants interacting with **AI Finance Controller**. It leverages LiveKit Agents 1.x, Deepgram Nova-2 speech recognition, Groq/Gemini financial reasoning, and ElevenLabs neural TTS.

## 🛠️ Components
1. `backend/agent.py`: Autonomous LiveKit agent with Silero VAD and financial context injection.
2. `backend/token_server.py`: Token issuer for secure browser room connections.
3. `backend/transaction_engine/`: Parser, normalizer, and discrepancy analyzer.
4. `client/`: Lightweight React WebRTC visualizer with real-time waveform and barge-in support.
