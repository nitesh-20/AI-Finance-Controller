# 🎙️ Vaani Real-Time Voice Sidecar — WebRTC AI Finance Copilot

> **Razorpay AI Buildathon — Track 04: AI Finance Controller ("Run the books and the cash position")**
> Low-latency WebRTC Voice Agent sidecar powered by LiveKit, Deepgram, Groq / Gemini, and ElevenLabs.

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    MERCHANT / CFO INTERFACE                  │
│                     (React + WebRTC SDK)                     │
│                                                              │
│   🎤 Live Audio Input            🔊 Sub-second Voice Stream  │
└──────────────────────────────▲───────────────────────────────┘
                               │ WebRTC Real-Time Channel
┌──────────────────────────────┴───────────────────────────────┐
│                    LIVEKIT WEBRTC ROUTER                     │
│               (LiveKit Cloud / Local Server)                 │
│                                                              │
│   • Low-latency audio packet routing                         │
│   • Silero Voice Activity Detection (VAD)                    │
│   • Instant interrupt handling & barge-in                    │
└──────────────────────────────▲───────────────────────────────┘
                               │ 16kHz PCM Stream
┌──────────────────────────────┴───────────────────────────────┐
│              VAANI FINANCE AGENT (Python Sidecar)            │
│                                                              │
│   1️⃣ Ingestion: LiveKit Agents 1.x                           │
│   2️⃣ STT: Deepgram Nova-2 (Hinglish/English)                │
│   3️⃣ Core: Finance Operations Intelligence                   │
│   4️⃣ Tool Calling: Reconciliation & Cash Engines             │
│   5️⃣ TTS: ElevenLabs Low-Latency Neural Audio               │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Capabilities for AI Finance Controller

1. **Deterministic Financial Anomaly Explanations**:
   - Understands questions like *"₹400 ka difference kahan se aaya?"*, *"Show unresolved exceptions"*, and *"What's our cash runway?"*.
2. **Instant Interruptibility / Barge-in**:
   - Supports natural speech interruptions via Silero VAD without buffer delays.
3. **Bilingual Conversational Fluency**:
   - Seamlessly speaks in natural merchant Hinglish or formal English.
4. **Zero-Hallucination Grounding**:
   - Ingests structured merchant ledger data and reconciliation manifests.

---

## 🚀 Quickstart

### 1. Backend Service
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 agent.py dev
```

### 2. Client Web Interface
```bash
cd client
npm install
npm run dev
```

---

## 🧪 Integration with AI Finance Controller
This real-time WebRTC sidecar complements the main **AI Finance Controller** platform (`/Vaani-AI` and `/backend`), offering ultra-low-latency voice interactions for merchant operations.
