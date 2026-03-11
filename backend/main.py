"""
Smart Minutes & Lecture Pro — Backend API
FastAPI application for file processing, transcription, and AI summarization.
"""

import os
import io
import json
import math
import time
import random
import tempfile
import traceback
import threading
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
import fitz
from fpdf import FPDF
import azure.cognitiveservices.speech as speechsdk

load_dotenv()

app = FastAPI(title="Smart Minutes & Lecture Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=os.getenv("GITHUB_TOKEN"),
)

# --- Demo Mode ---
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")

# --- Constants ---
CHUNK_TOKEN_LIMIT = 4000
CHUNK_OVERLAP_TOKENS = 500
SUPPORTED_DOCS = {".pdf"}
SUPPORTED_AUDIO = {".mp3", ".wav", ".m4a", ".ogg", ".webm", ".flac"}
SUPPORTED_VIDEO = {".mp4", ".mov", ".mkv", ".avi", ".webm"}

# --- Azure Speech ---
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY", "")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "southeastasia")


# ============================================================
# Demo Mode: Realistic mock responses
# ============================================================
DEMO_TRANSCRIPT = """Welcome everyone to today's meeting on the Q1 product roadmap. I'm Dr. Sarah Chen, and joining me are project lead Marcus Williams, UX designer Priya Patel, and backend engineer James Rodriguez.

Let me start by going over our key objectives for this quarter. First, we need to finalize the new user onboarding flow. Priya has been working on the redesign and the initial user testing showed a 40% improvement in completion rates. Priya, can you give us an update?

Priya: Sure, Sarah. We ran A/B tests with 500 users last week. Version B with the progressive disclosure pattern performed significantly better. The average onboarding time dropped from 8 minutes to 3.5 minutes. I recommend we go with Version B and roll it out by the end of February.

Marcus: That's great data. I agree we should move forward with Version B. James, how's the API migration going?

James: The migration to GraphQL is about 70% complete. We've moved the user service and the notification service. The payment service is the last major one, and I estimate two more weeks for that. One concern I have is the rate limiting — we need to implement proper throttling before we go live.

Sarah: Good point, James. Let's make rate limiting a priority. Marcus, can you add that to the sprint backlog?

Marcus: Already on it. I also want to bring up the analytics dashboard. Our stakeholders have been asking for real-time metrics. I suggest we use WebSockets for the live data feed instead of polling.

Sarah: That makes sense. Let's prioritize the items: first, complete the onboarding redesign rollout; second, finish the GraphQL migration with rate limiting; third, start the analytics dashboard. Any other items?

Priya: We should also address the accessibility audit findings. There are 12 high-priority issues that need to be fixed before our compliance deadline in March.

Marcus: Right, I'll create tickets for those. Let's assign the accessibility fixes to the front-end team and target mid-February for completion.

Sarah: Perfect. Let's wrap up. Everyone knows their priorities. We'll reconvene next Thursday for a progress check. Great work, team."""


def generate_demo_summary(text: str) -> dict:
    """Generate a realistic demo summary based on the input text length."""
    word_count = len(text.split())
    preview = text[:200].strip()

    return {
        "title": "Q1 Product Roadmap Planning Meeting",
        "summary": (
            "This meeting covered the Q1 product roadmap priorities, led by Dr. Sarah Chen with key team members. "
            "The team reviewed three major initiatives: the user onboarding redesign (showing 40% improvement in A/B testing), "
            "the GraphQL API migration (70% complete with rate limiting concerns), and a new real-time analytics dashboard proposal.\n\n"
            "Priya Patel presented compelling A/B test results from 500 users, recommending Version B of the progressive disclosure onboarding pattern "
            "which reduced average onboarding time from 8 minutes to 3.5 minutes. James Rodriguez reported progress on the API migration "
            "but flagged rate limiting as a critical requirement before production deployment.\n\n"
            "The team also discussed 12 high-priority accessibility audit findings that must be resolved before the March compliance deadline. "
            f"The session processed approximately {word_count} words of content."
        ),
        "keyTakeaways": [
            "User onboarding Version B reduced completion time by 56% (from 8 min to 3.5 min) based on A/B testing with 500 users",
            "GraphQL API migration is 70% complete — payment service migration needs 2 more weeks",
            "Rate limiting must be implemented before the GraphQL migration goes live in production",
            "WebSockets recommended over polling for the new real-time analytics dashboard",
            "12 high-priority accessibility issues must be fixed before March compliance deadline",
            "Progressive disclosure pattern proved significantly more effective for onboarding UX",
            "Next progress check meeting scheduled for Thursday",
        ],
        "actionItems": [
            {
                "task": "Roll out onboarding Version B to all users by end of February",
                "owner": "Priya Patel",
                "priority": "High",
            },
            {
                "task": "Complete payment service GraphQL migration with rate limiting",
                "owner": "James Rodriguez",
                "priority": "High",
            },
            {
                "task": "Add rate limiting implementation to sprint backlog",
                "owner": "Marcus Williams",
                "priority": "High",
            },
            {
                "task": "Create tickets for 12 accessibility audit fixes, target mid-February",
                "owner": "Marcus Williams",
                "priority": "Medium",
            },
            {
                "task": "Begin WebSocket-based real-time analytics dashboard design",
                "owner": "Priya Patel",
                "priority": "Medium",
            },
            {
                "task": "Schedule Thursday progress check meeting",
                "owner": "Dr. Sarah Chen",
                "priority": "Low",
            },
        ],
    }




# ============================================================
# Helper: Extract text from PDF
# ============================================================
# Helper: Estimate token count (rough: 1 token ≈ 4 chars)
# ============================================================
def estimate_tokens(text: str) -> int:
    return len(text) // 4


# ============================================================
# Helper: Chunk text for LLM processing
# ============================================================
def chunk_text(text: str, chunk_limit: int = CHUNK_TOKEN_LIMIT, overlap: int = CHUNK_OVERLAP_TOKENS) -> list[str]:
    """Split text into overlapping chunks based on estimated token count."""
    words = text.split()
    # Rough estimate: 1 token ≈ 0.75 words
    words_per_chunk = int(chunk_limit * 0.75)
    overlap_words = int(overlap * 0.75)

    if len(words) <= words_per_chunk:
        return [text]

    chunks = []
    start = 0
    while start < len(words):
        end = start + words_per_chunk
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - overlap_words

    return chunks


# ============================================================
# Helper: Summarize a single chunk
# ============================================================
def summarize_chunk(chunk: str, chunk_index: int, total_chunks: int) -> str:
    """Get a partial summary for a single text chunk."""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are summarizing part {chunk_index + 1} of {total_chunks} of a lecture/meeting transcript. "
                    "Provide a concise summary of the key points, important concepts, any action items mentioned, "
                    "and names of people if mentioned. Be thorough but concise."
                ),
            },
            {"role": "user", "content": chunk},
        ],
        temperature=0.3,
        max_tokens=2000,
    )
    return response.choices[0].message.content


# ============================================================
def extract_pdf_text(pdf_path: str) -> str:
    """Extract all text from a PDF document."""
    doc = fitz.open(pdf_path)
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n".join(text_parts)





# ============================================================
# Helper: Final structured summarization
# ============================================================
FINAL_SUMMARY_PROMPT = """You are an expert meeting and lecture notes assistant. Analyze the following text and produce a structured summary.

You MUST respond with valid JSON in exactly this format (no markdown, no code fences):
{
  "title": "A concise, descriptive title for this session",
  "summary": "A 2-3 paragraph high-level overview of the main topics discussed. Be specific and informative.",
  "keyTakeaways": [
    "First key takeaway or concept",
    "Second key takeaway or concept",
    "Third key takeaway or concept"
  ],
  "actionItems": [
    {
      "task": "Description of the action item or next step",
      "owner": "Person responsible (or 'Unassigned' if not mentioned)",
      "priority": "High / Medium / Low"
    }
  ]
}

Rules:
- The summary should be detailed and capture the essence of the content.
- Key takeaways should be the 5-10 most important points.
- Action items should be concrete next steps extracted from the text. If no action items are explicitly mentioned, infer 2-3 logical next steps.
- Assign owners only if specific names are mentioned in the text, otherwise use "Unassigned".
- Priority should be inferred from context and urgency."""


def generate_structured_summary(text: str) -> dict:
    """Generate the final structured summary using GitHub Models gpt-4o."""
    token_estimate = estimate_tokens(text)

    # If text fits in context, process directly
    if token_estimate < 100000:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": FINAL_SUMMARY_PROMPT},
                {"role": "user", "content": text},
            ],
            temperature=0.3,
            max_tokens=4000,
            response_format={ "type": "json_object" }
        )
        raw = response.choices[0].message.content.strip()
    else:
        # Chunk → summarize each → meta-summarize
        chunks = chunk_text(text)
        partial_summaries = []
        for i, chunk in enumerate(chunks):
            partial = summarize_chunk(chunk, i, len(chunks))
            partial_summaries.append(partial)

        combined = "\n\n---\n\n".join(
            [f"[Part {i+1}/{len(partial_summaries)}]\n{s}" for i, s in enumerate(partial_summaries)]
        )

        meta_prompt = (
            "The following are partial summaries of different sections of a long lecture or meeting. "
            "Combine them into a single, cohesive structured summary.\n\n" + combined
        )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": FINAL_SUMMARY_PROMPT},
                {"role": "user", "content": meta_prompt},
            ],
            temperature=0.3,
            max_tokens=4000,
            response_format={ "type": "json_object" }
        )
        raw = response.choices[0].message.content.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "title": "Summary",
            "summary": raw,
            "keyTakeaways": ["Unable to parse structured output."],
            "actionItems": [],
        }


# ============================================================
# Helper: Generate PDF from results
# ============================================================
class ResultsPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(40, 40, 40)
        self.cell(0, 10, "Smart Minutes & Lecture Pro", new_x="LMARGIN", new_y="NEXT", align="C")
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


def generate_pdf(results: dict, transcript: str) -> bytes:
    """Generate a PDF document from the processing results."""
    pdf = ResultsPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # Title
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(30, 30, 30)
    title = results.get("title", "Untitled Session")
    pdf.cell(0, 12, title, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    # Summary
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(0, 8, "High-Level Summary", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    summary = results.get("summary", "")
    pdf.multi_cell(0, 6, summary)
    pdf.ln(6)

    # Key Takeaways
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(0, 8, "Key Takeaways", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    for item in results.get("keyTakeaways", []):
        pdf.cell(5)
        pdf.multi_cell(0, 6, f"  * {item}")
        pdf.ln(1)
    pdf.ln(4)

    # Action Items Table
    action_items = results.get("actionItems", [])
    if action_items:
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(0, 8, "Action Items", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

        # Table header
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_fill_color(60, 60, 60)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(90, 8, "Task", border=1, fill=True)
        pdf.cell(50, 8, "Owner", border=1, fill=True)
        pdf.cell(40, 8, "Priority", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

        # Table rows
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(60, 60, 60)
        for item in action_items:
            pdf.cell(90, 7, str(item.get("task", ""))[:60], border=1)
            pdf.cell(50, 7, str(item.get("owner", "Unassigned")), border=1)
            pdf.cell(40, 7, str(item.get("priority", "Medium")), border=1, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(6)

    # Full Transcript
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(0, 8, "Full Transcript", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(80, 80, 80)
    # Truncate very long transcripts for PDF
    display_transcript = transcript[:50000] if len(transcript) > 50000 else transcript
    if len(transcript) > 50000:
        display_transcript += "\n\n[Transcript truncated for PDF. Full text available in-app.]"
    pdf.multi_cell(0, 5, display_transcript)

    return pdf.output()


# ============================================================
# Helper: Convert video/audio to WAV using moviepy/pydub
# ============================================================
def convert_to_wav(input_path: str, output_path: str):
    """Convert any audio/video file to 16kHz mono WAV for Azure Speech."""
    try:
        from moviepy import VideoFileClip, AudioFileClip
        ext = Path(input_path).suffix.lower()
        if ext in SUPPORTED_VIDEO:
            clip = VideoFileClip(input_path)
            audio = clip.audio
            audio.write_audiofile(output_path, fps=16000, nbytes=2, ffmpeg_params=["-ac", "1"], logger=None)
            clip.close()
        else:
            clip = AudioFileClip(input_path)
            clip.write_audiofile(output_path, fps=16000, nbytes=2, ffmpeg_params=["-ac", "1"], logger=None)
            clip.close()
    except Exception:
        # Fallback: pydub
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(output_path, format="wav")


# ============================================================
# Helper: Transcribe WAV using Azure Speech SDK (continuous)
# ============================================================
def transcribe_with_azure(wav_path: str) -> str:
    """Use Azure Speech SDK continuous recognition to transcribe a WAV file."""
    if not AZURE_SPEECH_KEY:
        raise RuntimeError("AZURE_SPEECH_KEY is not configured in .env")

    speech_config = speechsdk.SpeechConfig(
        subscription=AZURE_SPEECH_KEY,
        region=AZURE_SPEECH_REGION
    )
    speech_config.speech_recognition_language = "en-US"
    speech_config.set_property(
        speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "10000"
    )
    speech_config.set_property(
        speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "3000"
    )

    audio_config = speechsdk.AudioConfig(filename=wav_path)
    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    all_text = []
    done = threading.Event()

    def recognized_cb(evt):
        if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
            all_text.append(evt.result.text)

    def stop_cb(evt):
        done.set()

    recognizer.recognized.connect(recognized_cb)
    recognizer.session_stopped.connect(stop_cb)
    recognizer.canceled.connect(stop_cb)

    recognizer.start_continuous_recognition()
    done.wait(timeout=600)   # max 10 min
    recognizer.stop_continuous_recognition()

    return " ".join(all_text)


# ============================================================
# API Endpoints
# ============================================================

@app.get("/api/health")
async def health():
    """Health check endpoint."""
    has_key = bool(os.getenv("GITHUB_TOKEN"))
    return {"status": "ok", "openai_configured": has_key, "demo_mode": DEMO_MODE}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a PDF file and extract its text content.
    """
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()

    if ext not in SUPPORTED_DOCS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Only PDF files are supported.",
        )

    # Save uploaded file to temp
    temp_file = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    content = await file.read()
    temp_file.write(content)
    temp_file.close()

    try:
        text = extract_pdf_text(temp_file.name)
        return {"type": "pdf", "text": text, "filename": filename}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
    finally:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)


@app.post("/api/transcribe")
async def transcribe_media(file: UploadFile = File(...)):
    """
    Transcribe an audio or video file using Azure Speech Services.
    Accepts: mp3, wav, m4a, ogg, webm, flac (audio) and mp4, mov, mkv, avi (video).
    """
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()

    all_supported = SUPPORTED_AUDIO | SUPPORTED_VIDEO
    if ext not in all_supported:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(sorted(all_supported))}",
        )

    # Save original file
    original_tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    content = await file.read()
    original_tmp.write(content)
    original_tmp.close()

    # Output WAV path
    wav_tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    wav_tmp.close()

    try:
        # Convert to 16kHz mono WAV
        convert_to_wav(original_tmp.name, wav_tmp.name)

        # Transcribe
        transcript = transcribe_with_azure(wav_tmp.name)

        if not transcript.strip():
            transcript = "[No speech detected in the file]"

        file_type = "video" if ext in SUPPORTED_VIDEO else "audio"
        return {
            "type": file_type,
            "transcript": transcript,
            "filename": filename,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")
    finally:
        for p in [original_tmp.name, wav_tmp.name]:
            if os.path.exists(p):
                os.unlink(p)


@app.post("/api/process")
async def process_text(text: str = Form(...)):
    """
    Process text through the LLM to generate structured summary.
    Handles chunking for very long texts automatically.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="No text provided")

    try:
        if DEMO_MODE:
            time.sleep(2)  # Simulate LLM thinking time
            results = generate_demo_summary(text.strip())
        else:
            results = generate_structured_summary(text.strip())
        return {"results": results}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"LLM processing error: {str(e)}")


@app.post("/api/export-pdf")
async def export_pdf(
    title: str = Form(""),
    summary: str = Form(""),
    keyTakeaways: str = Form("[]"),
    actionItems: str = Form("[]"),
    transcript: str = Form(""),
):
    """Generate and download a PDF of the results."""
    try:
        results = {
            "title": title,
            "summary": summary,
            "keyTakeaways": json.loads(keyTakeaways),
            "actionItems": json.loads(actionItems),
        }
    except json.JSONDecodeError:
        results = {"title": title, "summary": summary, "keyTakeaways": [], "actionItems": []}

    pdf_bytes = generate_pdf(results, transcript)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="smart-minutes-{title[:30].replace(" ", "-")}.pdf"'},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
