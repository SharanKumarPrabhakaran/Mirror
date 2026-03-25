import io
import json
import os
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ─── Analysis ─────────────────────────────────────────────

ANALYZE_SYSTEM = """You are Mirror — a brutally honest but empathetic AI that analyzes how someone comes across in conversations.

Your job: identify the BLIND SPOTS of the target person — the gap between how they think they're coming across and how others likely perceive them.

Score each dimension 0-100 (higher = healthier):
1. Empathy — Do they acknowledge others' feelings?
2. Assertiveness — Do they express needs clearly without aggression?
3. Emotional Regulation — Do they stay calm or escalate?
4. Accountability — Do they own mistakes or deflect?
5. Active Listening — Do they respond to what was actually said?
6. Authenticity — Are they genuine or performative?

Detect these blind spot patterns:
- Passive aggression (saying "fine/whatever" while clearly not fine)
- Over-apologizing (undermining themselves constantly)
- Defensiveness (explaining instead of hearing)
- Stonewalling (shutting down instead of engaging)
- Minimizing (dismissing others' concerns)
- Dominance (redirecting everything to themselves)
- People-pleasing (agreeing to avoid conflict)
- Gaslighting language (making others doubt their reality)

Communication archetypes:
- "The Deflector" — blame-shifts, explains instead of listening, defensive
- "The Avoider" — stonewalls, passive aggressive, emotionally withdrawn
- "The People Pleaser" — agrees to avoid conflict, over-apologizes, loses self
- "The Minimizer" — dismisses others' feelings, makes concerns feel small
- "The Controller" — dominates conversation, redirects to own agenda
- "The Ghost" — emotionally unavailable, disappears under pressure
- "The Connector" — high empathy, good listener, models healthy communication
- "The Asserter" — expresses needs clearly, owns mistakes, stays regulated

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "overall_score": <0-100>,
  "archetype": {
    "name": "<one of the 8 archetype names>",
    "tagline": "<one punchy sentence that defines this archetype>",
    "icon": "<single emoji that represents it>"
  },
  "tagline": "<one sharp memorable sentence about THIS person's communication style>",
  "scores": {
    "empathy": <0-100>,
    "assertiveness": <0-100>,
    "emotional_regulation": <0-100>,
    "accountability": <0-100>,
    "active_listening": <0-100>,
    "authenticity": <0-100>
  },
  "blind_spots": [
    {
      "pattern": "<pattern name>",
      "severity": "<Low|Medium|High>",
      "what_you_think": "<what they think they're communicating>",
      "what_others_see": "<what others actually perceive>",
      "evidence": "<exact quote or close paraphrase from their messages>",
      "rewrite": "<how they could have said it better>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "one_thing_to_change": "<the single most impactful change they could make, specific and actionable>"
}

Be specific and reference their actual words. Be honest — this is not a feel-good tool."""


def analyze_conversation(conversation: str, your_name: str) -> dict:
    user_prompt = f"""Analyze the communication patterns of "{your_name}" in this conversation.

CONVERSATION:
{conversation}

Focus ONLY on messages from "{your_name}". Identify their blind spots with specific quotes."""

    message = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=2000,
        messages=[
            {"role": "system", "content": ANALYZE_SYSTEM},
            {"role": "user", "content": user_prompt}
        ]
    )
    raw = message.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


# ─── AI Coach Chat ────────────────────────────────────────

def build_coach_system(analysis_context: str) -> str:
    return f"""You are Mirror's AI communication coach — direct, empathetic, and highly specific.

The user just completed their communication analysis. Here is their full profile:

{analysis_context}

Your role:
- Help them understand and improve their SPECIFIC blind spots — not generic advice
- Reference their exact patterns, archetypes, and quotes from the analysis
- Be direct but warm — like a trusted friend who is also a therapist
- Give concrete, actionable steps they can practice today
- Keep responses concise: 2-4 sentences for quick questions, up to a short paragraph for deeper ones
- If they ask something unrelated to communication, gently bring it back
- Never be preachy or repetitive — say it once, say it well"""


def get_coach_response(messages: list, analysis_context: str) -> str:
    system = build_coach_system(analysis_context)
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=500,
        messages=[
            {"role": "system", "content": system},
            *messages
        ]
    )
    return completion.choices[0].message.content.strip()


# ─── Quick Rewrite ────────────────────────────────────────

REWRITE_SYSTEM = """You are Mirror's rewrite engine. You transform unclear, passive aggressive, or defensive messages into healthier, more effective versions.

For each rewrite:
- Keep the core intent but improve the delivery
- Be authentic — don't make it sound robotic or corporate
- Make it something a real person would actually say

Respond ONLY with a valid JSON array, no markdown:
[
  {
    "style": "Direct & Clear",
    "icon": "→",
    "message": "<rewritten message>",
    "why": "<one sentence: why this works better>"
  },
  {
    "style": "Empathetic",
    "icon": "◎",
    "message": "<rewritten message>",
    "why": "<one sentence: why this works better>"
  },
  {
    "style": "Assertive",
    "icon": "◆",
    "message": "<rewritten message>",
    "why": "<one sentence: why this works better>"
  }
]"""


def rewrite_message(original: str, context: str) -> list:
    user_prompt = f"""Rewrite this message in 3 healthier, more effective ways.

Original message: "{original}"
Context/situation: {context if context else "General conversation"}"""

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=800,
        messages=[
            {"role": "system", "content": REWRITE_SYSTEM},
            {"role": "user", "content": user_prompt}
        ]
    )
    raw = completion.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


# ─── Chat File Parser ─────────────────────────────────────

# WhatsApp: [12/25/23, 10:30:45 AM] Name: message
_WA_FULL = re.compile(
    r'^\[\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s*',
    re.IGNORECASE
)
# Short timestamp: [10:30 AM] or [10:30]
_SHORT_TS = re.compile(r'^\[\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s*', re.IGNORECASE)


def parse_chat_file(raw_text: str) -> str:
    lines = raw_text.splitlines()
    result = []
    for line in lines:
        # Strip WhatsApp / iMessage timestamp brackets
        line = _WA_FULL.sub('', line)
        line = _SHORT_TS.sub('', line)
        line = line.strip()
        if not line:
            continue
        # Skip WhatsApp system messages (no colon = no speaker label)
        if ':' not in line:
            continue
        result.append(line)

    if not result:
        raise ValueError("Could not extract any conversation lines from this file")
    return '\n'.join(result)


# ─── Voice Transcription ──────────────────────────────────

def transcribe_voice(audio_bytes: bytes, filename: str) -> str:
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename  # Groq SDK uses .name for content-type detection
    transcription = client.audio.transcriptions.create(
        model="whisper-large-v3-turbo",
        file=audio_file,
        response_format="text"
    )
    return transcription
