# ◈ Mirror
### *The mirror doesn't lie.*

> **AI that shows you how you actually come across in conversations.**
> Paste a chat. Upload a voice clip. Find out what others see that you don't.

---

## What is Mirror?

Most people think they communicate well. They're wrong.

Mirror analyzes your conversations and surfaces the **blind spots** between what you *mean* to say and what others *actually hear* — with brutal honesty, specific evidence from your own words, and actionable rewrites.

Built for **Resolution Hacks 2026** @ Harvard — targeting the intersection of AI, relationships, and self-awareness.

---

## Features

### Conversation Analysis
Drop in any conversation — texts, emails, Slack, WhatsApp — and Mirror returns a full breakdown in seconds.

| What you get | Details |
|---|---|
| **Self-Awareness Score** | 0–100 score with animated ring |
| **Communication Archetype** | One of 8 types: The Deflector, The Avoider, The People Pleaser, and more |
| **6-Dimension Profile** | Empathy · Assertiveness · Emotional Regulation · Accountability · Active Listening · Authenticity |
| **Blind Spot Cards** | Each pattern with: what you think you said vs. what they heard + exact quote + better rewrite |
| **Strengths** | What you actually do well |
| **The One Thing** | The single highest-impact change you could make |

### AI Coach Chat
After your analysis, chat with **Mirror's AI coach** — it knows your exact patterns, your archetype, and your blind spots. Ask it anything.

> *"How do I stop being passive aggressive?"*
> *"Why do I always shut down in arguments?"*
> *"What's a better way to give feedback?"*

### Quick Rewrite
Paste any single message. Get 3 AI-rewritten versions instantly:
- **→ Direct & Clear** — say what you mean
- **◎ Empathetic** — acknowledge their experience
- **◆ Assertive** — express needs without aggression

### File & Voice Upload
| Input type | How it works |
|---|---|
| `.txt` chat export | WhatsApp, Slack, iMessage exports — timestamps stripped automatically |
| Audio clip | `.mp3 · .m4a · .wav · .webm · .ogg` — transcribed via Groq Whisper in seconds |
| Drag & drop | Drop any supported file directly onto the upload zone |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python · FastAPI · Uvicorn |
| **AI Analysis** | Groq · `llama-3.3-70b-versatile` |
| **Voice Transcription** | Groq Whisper · `whisper-large-v3-turbo` |
| **Frontend** | Vanilla HTML · CSS · JavaScript |
| **Charts** | Chart.js (radar chart) |
| **Fonts** | Cormorant Garamond · Figtree |

No database. No accounts. No data stored. Everything runs in real-time.

---

## Getting Started

### Prerequisites
- Python 3.9+
- A free [Groq API key](https://console.groq.com)

### Installation

```bash
# Clone the repo
git clone https://github.com/SharanKumarPrabhakaran/Mirror.git
cd Mirror

# Install dependencies
pip install -r backend/requirements.txt

# Set up environment
echo "GROQ_API_KEY=your_key_here" > backend/.env

# Run the server
cd backend && uvicorn main:app --port 8000 --reload
```

Open **http://localhost:8000** in your browser.

---

## How to Use

**Analyze a conversation**
1. Paste any conversation in the textarea (or upload a `.txt` export / voice clip)
2. Enter your name as it appears in the chat
3. Click **Look in the Mirror**
4. View your full communication profile

**Try a sample** — click The Avoider, The Deflector, or The Pleaser to load a pre-built demo conversation.

**Quick Rewrite** — switch to the Rewrite tab, paste any message, get 3 better versions instantly.

**Ask the coach** — after your results load, use the AI Coach chat at the bottom to dig deeper.

---

## The 8 Communication Archetypes

| Archetype | Pattern |
|---|---|
| 🛡 **The Deflector** | Explains instead of listening. Blame-shifts. Gets defensive under pressure. |
| 👻 **The Avoider** | Stonewalls. Goes passive aggressive. Emotionally withdraws. |
| 🤝 **The People Pleaser** | Agrees to avoid conflict. Over-apologizes. Loses their own voice. |
| 🔕 **The Minimizer** | Dismisses others' feelings. Makes concerns feel small or dramatic. |
| 📢 **The Controller** | Dominates the conversation. Redirects everything to their own agenda. |
| 🌫 **The Ghost** | Emotionally unavailable. Disappears under pressure. Hard to reach. |
| 🌟 **The Connector** | High empathy. Good listener. Models healthy communication. |
| 💎 **The Asserter** | Expresses needs clearly. Owns mistakes. Stays regulated under stress. |

---

## Privacy

- Conversations are **never stored** on any server
- Analysis happens in real-time and is discarded after the response
- Voice clips are transcribed and immediately discarded
- No user accounts, no tracking, no logs

---

## Built at Resolution Hacks 2026

Mirror was built in one day at **Resolution Hacks** — a hackathon hosted by [Resolution](https://resolution.community), a community helping young adults leverage AI to work through relationships, health, and careers.

**Sponsors:** Eight Sleep · swsh · Duckbill · Fragile · Clair · Wayfair

---

## License

MIT
