import { useState } from "react";
import { FileText, Keyboard, Music, Video } from "lucide-react";
import FileUploader from "./FileUploader";

const MODE_CONFIG = {
    pdf: {
        icon: FileText,
        label: "Upload PDF Document",
        sublabel: "We'll extract text and generate a structured summary",
        accept: ".pdf",
        uploaderLabel: "Drop your PDF document here",
        color: "from-violet-500 to-purple-600",
        glow: "shadow-violet-500/30",
        inputType: "file",
    },
    text: {
        icon: Keyboard,
        label: "Paste Your Text",
        sublabel: "Paste meeting notes, lecture content, or any text for analysis",
        color: "from-blue-500 to-cyan-500",
        glow: "shadow-blue-500/30",
        inputType: "textarea",
    },
    audio: {
        icon: Music,
        label: "Upload Audio File",
        sublabel: "Azure Speech will transcribe your audio, then AI will summarize it",
        accept: ".mp3,.wav,.m4a,.ogg,.flac,.webm",
        uploaderLabel: "Drop your audio file here (MP3, WAV, M4A, OGG, FLAC)",
        color: "from-emerald-500 to-teal-500",
        glow: "shadow-emerald-500/30",
        inputType: "file",
    },
    video: {
        icon: Video,
        label: "Upload Video File",
        sublabel: "We'll extract the audio track, transcribe speech, and summarize",
        accept: ".mp4,.mov,.mkv,.avi,.webm",
        uploaderLabel: "Drop your video file here (MP4, MOV, MKV, AVI)",
        color: "from-orange-500 to-amber-500",
        glow: "shadow-orange-500/30",
        inputType: "file",
    },
};

export default function InputHub({ mode, onSubmit, disabled }) {
    const [textInput, setTextInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const cfg = MODE_CONFIG[mode] || MODE_CONFIG.pdf;
    const Icon = cfg.icon;

    const handleProcess = () => {
        if (cfg.inputType === "textarea" && textInput.trim()) {
            onSubmit?.({ type: "text", data: textInput.trim(), mode });
        } else if (cfg.inputType === "file" && selectedFile) {
            onSubmit?.({ type: "file", data: selectedFile, mode });
        }
    };

    const canProcess =
        (cfg.inputType === "textarea" && textInput.trim().length > 0) ||
        (cfg.inputType === "file" && !!selectedFile);

    return (
        <div className="w-full max-w-3xl mx-auto animate-slide-up">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br ${cfg.color} ${cfg.glow}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{cfg.label}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{cfg.sublabel}</p>
                </div>
            </div>

            {/* Input area */}
            <div className="glass-card rounded-2xl p-6">
                {cfg.inputType === "file" && (
                    <FileUploader
                        accept={cfg.accept}
                        label={cfg.uploaderLabel}
                        icon={Icon}
                        onFileSelect={setSelectedFile}
                    />
                )}

                {cfg.inputType === "textarea" && (
                    <div>
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Paste your notes, transcript, or any text here..."
                            className="w-full h-64 p-4 rounded-xl bg-muted/50 border border-border text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm leading-relaxed"
                            disabled={disabled}
                        />
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-muted-foreground">
                                {textInput.length.toLocaleString()} characters
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ~{Math.ceil(textInput.split(/\s+/).filter(Boolean).length / 250)} min read
                            </span>
                        </div>
                    </div>
                )}

                {/* Note for audio/video */}
                {(mode === "audio" || mode === "video") && (
                    <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Powered by <strong>Azure Speech Services</strong> — transcription may take a moment for longer files.
                    </p>
                )}

                {/* Process button */}
                <button
                    onClick={handleProcess}
                    disabled={!canProcess || disabled}
                    className={`w-full mt-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${canProcess && !disabled
                            ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99]"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                >
                    {disabled
                        ? "Processing..."
                        : mode === "audio" || mode === "video"
                            ? "🎙️ Transcribe & Summarize"
                            : "✨ Generate Smart Summary"}
                </button>
            </div>
        </div>
    );
}
