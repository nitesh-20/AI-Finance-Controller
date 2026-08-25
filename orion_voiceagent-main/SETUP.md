# Setup & Deployment: Vaani WebRTC Real-Time Voice Sidecar

### Prerequisites
- Python 3.11+
- Node.js 18+
- LiveKit URL, API Key & API Secret
- Deepgram API Key
- Groq / Gemini API Key
- ElevenLabs API Key

---

### Backend Service Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # populate API keys
python3 agent.py dev
```

---

### Frontend Client Setup
```bash
cd client
npm install
npm run dev
```
