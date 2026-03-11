# 🧠 Smart Minutes & Lecture Pro

An AI-powered web application that transforms any content — PDFs, text, audio, or video — into structured summaries, key takeaways, and actionable items. Perfect for students and professionals to manage lecture notes and meeting minutes.

---

## ✨ Features

- **PDF / Document** — Upload PDF files and extract text for AI summarization.
- **Manual Text** — Paste meeting notes, transcripts, or any raw text directly.
- **Audio File** — Upload MP3, WAV, M4A, OGG, or FLAC; transcribed via **Azure Speech Services**.
- **Video File** — Upload MP4, MOV, MKV, or AVI; audio is extracted and speech is transcribed.
- **AI Summarization** — Powered by **GPT-4o** (via GitHub Models) to generate structured insights.
- **Dark / Light Mode** — Seamlessly toggle between themes for comfortable reading.
- **PDF Export** — Download results as a formatted, professional PDF report.

---

## ⚡ Try Instantly (https://meeting-minutes-virid.vercel.app/)

You can explore the interface and features without setting up Azure or GitHub keys by enabling **Demo Mode**.

1. **Clone the repo** and follow the [Setup](#-getting-started) instructions below.
2. In your `backend/.env` file, set:
   ```env
   DEMO_MODE=true
