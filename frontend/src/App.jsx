import { useState, useCallback, useEffect } from "react";
import {
  Sparkles, RotateCcw, Zap, Activity,
  FileText, Keyboard, Brain, Clock, CheckSquare, Globe,
  Music, Video
} from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import InputHub from "./components/InputHub";
import ProcessingState from "./components/ProcessingState";
import ResultsView from "./components/ResultsView";
import { uploadFile, transcribeMedia, processText, healthCheck } from "./lib/api";
import "./index.css";

const VIEWS = { LANDING: "landing", INPUT: "input", PROCESSING: "processing", RESULTS: "results" };

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    desc: "Advanced LLMs extract key insights, summaries, and action items automatically.",
    color: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
  },
  {
    icon: CheckSquare,
    title: "Action Item Extraction",
    desc: "Automatically identifies tasks, decisions, and follow-ups from your content.",
    color: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/20",
  },
  {
    icon: Clock,
    title: "Instant Processing",
    desc: "Get structured summaries in seconds, no matter how long your content is.",
    color: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
  },
  {
    icon: Globe,
    title: "Multi-Source Input",
    desc: "PDF docs, raw text, audio recordings, or full video files — all supported.",
    color: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/20",
  },
];

const INPUT_MODES = [
  {
    id: "pdf",
    label: "PDF / Document",
    desc: "Upload a PDF file. We'll extract text and generate a smart summary.",
    cta: "Upload PDF",
    icon: FileText,
    color: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/30",
  },
  {
    id: "text",
    label: "Manual Text",
    desc: "Paste meeting notes, lecture transcripts, or any text for analysis.",
    cta: "Paste Text",
    icon: Keyboard,
    color: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/30",
  },
  {
    id: "audio",
    label: "Audio File",
    desc: "Upload MP3, WAV, M4A, OGG or FLAC. Azure Speech will transcribe it.",
    cta: "Upload Audio",
    icon: Music,
    color: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/30",
  },
  {
    id: "video",
    label: "Video File",
    desc: "Upload MP4, MOV, MKV or AVI. We extract audio and transcribe speech.",
    cta: "Upload Video",
    icon: Video,
    color: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/30",
  },
];

export default function App() {
  const [dark, setDark] = useState(true);
  const [view, setView] = useState(VIEWS.LANDING);
  const [inputMode, setInputMode] = useState(null);
  const [step, setStep] = useState(0);
  const [results, setResults] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    healthCheck().then(setBackendStatus).catch(() => setBackendStatus({ status: "error" }));
  }, []);

  const handleModeSelect = useCallback((mode) => {
    setInputMode(mode);
    setView(VIEWS.INPUT);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (input) => {
    setView(VIEWS.PROCESSING);
    setStep(0);
    setError(null);
    setResults(null);
    setTranscript("");

    try {
      let extractedText = "";

      if (input.type === "text") {
        extractedText = input.data;
        setTranscript(extractedText);
        setStep(2);
      } else if (input.type === "file" && input.mode === "pdf") {
        setStep(0);
        const uploadResult = await uploadFile(input.data);
        setStep(1);
        await new Promise((r) => setTimeout(r, 400));
        extractedText = uploadResult.text;
        setTranscript(extractedText);
        setStep(2);
      } else if (input.type === "file" && (input.mode === "audio" || input.mode === "video")) {
        setStep(0);
        const result = await transcribeMedia(input.data);
        setStep(1);
        await new Promise((r) => setTimeout(r, 400));
        extractedText = result.transcript;
        setTranscript(extractedText);
        setStep(2);
      }

      const processResult = await processText(extractedText);
      setResults(processResult.results);
      setStep(3);
      await new Promise((r) => setTimeout(r, 800));
      setView(VIEWS.RESULTS);
    } catch (err) {
      console.error("Processing error:", err);
      setError(err.message || "An unexpected error occurred");
      setView(VIEWS.INPUT);
    }
  }, []);

  const handleReset = useCallback(() => {
    setView(VIEWS.LANDING);
    setInputMode(null);
    setResults(null);
    setTranscript("");
    setError(null);
    setStep(0);
  }, []);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold tracking-tight">Smart Minutes</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">&amp; Lecture Pro</p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            {backendStatus && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${backendStatus.status === "ok"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
              >
                <Activity className="w-3 h-3" />
                {backendStatus.status === "ok" ? "API Connected" : "API Offline"}
              </div>
            )}
            {(view === VIEWS.RESULTS || view === VIEWS.INPUT) && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-accent transition-all text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Home
              </button>
            )}
            <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 animate-slide-up">
            <Zap className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Processing Error</p>
              <p className="mt-1 opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* ── LANDING ── */}
        {view === VIEWS.LANDING && (
          <div className="animate-slide-up">
            {/* Hero */}
            <div className="text-center mb-16 pt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                AI-Powered Document &amp; Media Intelligence
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-tight">
                Transform <span className="gradient-text">Any Content</span><br />into Actionable Insights
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Upload PDFs, paste text, or drop an audio/video file. Our AI engine transcribes,
                analyzes, and generates structured summaries with action items — in seconds.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className={`glass-card rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 shadow-lg ${f.glow}`}>
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-sm text-muted-foreground font-medium px-2">Get Started — Choose Your Input</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {/* Mode selector — 4 cards in 2×2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto pb-10">
              {INPUT_MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeSelect(m.id)}
                    className="group glass-card rounded-2xl p-8 text-left hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-5 shadow-lg ${m.glow} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{m.label}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{m.desc}</p>
                    <div className="mt-5 flex items-center gap-2 text-primary text-sm font-medium">
                      <span>{m.cta}</span>
                      <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── INPUT ── */}
        {view === VIEWS.INPUT && (
          <InputHub mode={inputMode} onSubmit={handleSubmit} disabled={false} />
        )}

        {/* ── PROCESSING ── */}
        {view === VIEWS.PROCESSING && (
          <ProcessingState currentStep={step} />
        )}

        {/* ── RESULTS ── */}
        {view === VIEWS.RESULTS && (
          <ResultsView results={results} transcript={transcript} />
        )}
      </main>

      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
          Smart Minutes &amp; Lecture Pro — Powered by Azure Speech + Gemini AI
        </div>
      </footer>
    </div>
  );
}
