# 🧠 Smart Minutes & Lecture Pro

An AI-powered web application that transforms any content — PDFs, text, audio, or video — into structured summaries, key takeaways, and actionable items.

---

## ✨ Features

- **PDF / Document** — Upload PDF files and extract text for AI summarization
- **Manual Text** — Paste meeting notes, transcripts, or any raw text
- **Audio File** — Upload MP3, WAV, M4A, OGG, or FLAC; transcribed via Azure Speech Services
- **Video File** — Upload MP4, MOV, MKV, or AVI; audio is extracted and speech is transcribed
- **AI Summarization** — Powered by GPT-4o (via GitHub Models) to generate:
  - High-level summary
  - Key takeaways
  - Action items with owners and priority
- **Dark / Light Mode** — Toggle between themes
- **PDF Export** — Download results as a formatted PDF report

---

## 🗂️ Project Structure

```
NLP/
├── backend/            # FastAPI backend
│   ├── main.py         # API routes, Azure Speech, PDF extraction, LLM summarization
│   ├── .env            # Environment variables (API keys)
│   └── requirements.txt
└── frontend/           # React + Vite frontend
    └── src/
        ├── App.jsx             # Main app with landing page + view routing
        ├── components/
        │   ├── InputHub.jsx        # Mode-based input (pdf/text/audio/video)
        │   ├── FileUploader.jsx    # Drag-and-drop file uploader
        │   ├── ProcessingState.jsx # Step-by-step processing UI
        │   ├── ResultsView.jsx     # Display summary, takeaways, action items
        │   └── ThemeToggle.jsx     # Dark/light mode toggle
        └── lib/
            └── api.js          # API client (upload, transcribe, process, export)
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- [FFmpeg](https://ffmpeg.org/) (required for audio/video conversion — must be on PATH)

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
GITHUB_TOKEN=your_github_token_here
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=southeastasia
DEMO_MODE=false
```

Start the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload` | Upload and extract text from a PDF |
| `POST` | `/api/transcribe` | Transcribe audio or video via Azure Speech |
| `POST` | `/api/process` | Summarize text using GPT-4o |
| `POST` | `/api/export-pdf` | Export results as downloadable PDF |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, Uvicorn |
| AI / LLM | GPT-4o via GitHub Models (Azure inference) |
| Speech-to-Text | Azure Cognitive Services Speech SDK |
| PDF Extraction | PyMuPDF (`fitz`) |
| Audio/Video | MoviePy, pydub |
| PDF Export | fpdf2 |

---

## 📋 Supported File Types

| Type | Formats |
|------|---------|
| Document | `.pdf` |
| Audio | `.mp3` `.wav` `.m4a` `.ogg` `.flac` `.webm` |
| Video | `.mp4` `.mov` `.mkv` `.avi` `.webm` |

---

## 📄 License

MIT
