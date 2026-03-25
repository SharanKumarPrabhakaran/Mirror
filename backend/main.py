from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from analyzer import analyze_conversation, get_coach_response, rewrite_message, parse_chat_file, transcribe_voice
import os

app = FastAPI(title="Mirror API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/static", StaticFiles(directory=frontend_path), name="static")


# ─── Models ───────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    conversation: str
    your_name: str

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class CoachRequest(BaseModel):
    messages: List[ChatMessage]
    analysis_context: str  # JSON-serialized summary of the analysis

class RewriteRequest(BaseModel):
    message: str
    context: Optional[str] = ""


# ─── Routes ───────────────────────────────────────────────

@app.get("/")
def root():
    return FileResponse(os.path.join(frontend_path, "index.html"))


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    if not request.conversation.strip():
        raise HTTPException(status_code=400, detail="Conversation cannot be empty")
    if not request.your_name.strip():
        raise HTTPException(status_code=400, detail="Your name cannot be empty")
    if len(request.conversation) < 50:
        raise HTTPException(status_code=400, detail="Please paste a longer conversation for accurate analysis")

    result = analyze_conversation(request.conversation, request.your_name)
    return result


@app.post("/coach")
async def coach(request: CoachRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty")
    if len(request.messages) > 20:
        raise HTTPException(status_code=400, detail="Conversation too long")

    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    reply = get_coach_response(messages, request.analysis_context)
    return {"reply": reply}


@app.post("/rewrite")
async def rewrite(request: RewriteRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(request.message) > 1000:
        raise HTTPException(status_code=400, detail="Message too long")

    rewrites = rewrite_message(request.message, request.context)
    return {"rewrites": rewrites}


@app.post("/upload/chat")
async def upload_chat(file: UploadFile = File(...)):
    if not (file.filename or '').lower().endswith('.txt'):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")
    raw_bytes = await file.read()
    if len(raw_bytes) > 500_000:
        raise HTTPException(status_code=400, detail="File too large. Max 500KB for chat files")
    try:
        raw_text = raw_bytes.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Could not read file — save as UTF-8 text")
    try:
        parsed = parse_chat_file(raw_text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"text": parsed, "source": "chat_file"}


@app.post("/upload/voice")
async def upload_voice(file: UploadFile = File(...)):
    allowed = {'.mp3', '.m4a', '.wav', '.webm', '.ogg'}
    ext = os.path.splitext(file.filename or '')[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported audio format. Use mp3, m4a, wav, webm, or ogg")
    audio_bytes = await file.read()
    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Groq Whisper accepts up to 25MB")
    try:
        transcript = transcribe_voice(audio_bytes, file.filename)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}")
    return {"text": transcript, "source": "voice_transcript"}


@app.get("/health")
def health():
    return {"status": "ok"}
