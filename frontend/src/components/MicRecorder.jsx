import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, AudioLines } from "lucide-react";

export default function MicRecorder({ onRecordingComplete }) {
    const [recording, setRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);

    const formatDuration = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const startAnalyser = useCallback((stream) => {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = { audioCtx, analyser };

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setAudioLevel(avg / 255);
            animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                    ? "audio/webm;codecs=opus"
                    : "audio/webm",
            });

            chunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const file = new File([blob], "recording.webm", { type: "audio/webm" });
                onRecordingComplete?.(file);
                stream.getTracks().forEach((t) => t.stop());
                if (analyserRef.current) {
                    analyserRef.current.audioCtx.close();
                }
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            };

            mediaRecorder.start(1000);
            mediaRecorderRef.current = mediaRecorder;
            setRecording(true);
            setDuration(0);
            timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
            startAnalyser(stream);
        } catch (err) {
            console.error("Mic access denied:", err);
            alert("Microphone access is required. Please allow microphone permission.");
        }
    }, [onRecordingComplete, startAnalyser]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        setRecording(false);
        clearInterval(timerRef.current);
        setAudioLevel(0);
    }, []);

    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    // Generate waveform bars
    const bars = Array.from({ length: 24 }, (_, i) => {
        const height = recording
            ? 8 + Math.sin(Date.now() / 200 + i * 0.5) * 16 * audioLevel + Math.random() * 8 * audioLevel
            : 4;
        return height;
    });

    return (
        <div className="flex flex-col items-center gap-6 py-6">
            {/* Waveform visualizer */}
            <div className="flex items-center justify-center gap-[3px] h-16 w-full max-w-xs">
                {bars.map((h, i) => (
                    <div
                        key={i}
                        className="w-[6px] rounded-full transition-all duration-150"
                        style={{
                            height: `${Math.max(4, h)}px`,
                            background: recording
                                ? `hsl(252 87% ${54 + audioLevel * 20}%)`
                                : "hsl(var(--muted-foreground))",
                            opacity: recording ? 0.6 + audioLevel * 0.4 : 0.3,
                        }}
                    />
                ))}
            </div>

            {/* Duration */}
            <div className="font-mono text-3xl font-bold text-foreground tracking-wider">
                {formatDuration(duration)}
            </div>

            {/* Record/Stop Button */}
            <button
                onClick={recording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${recording
                        ? "bg-destructive hover:bg-destructive/80 shadow-lg shadow-destructive/30 animate-pulse-glow"
                        : "bg-primary hover:bg-primary/80 shadow-lg shadow-primary/30 hover:scale-105"
                    }`}
            >
                {recording ? (
                    <Square className="w-8 h-8 text-white fill-white" />
                ) : (
                    <Mic className="w-8 h-8 text-white" />
                )}
            </button>

            <p className="text-sm text-muted-foreground">
                {recording ? (
                    <span className="flex items-center gap-2">
                        <AudioLines className="w-4 h-4 text-destructive animate-pulse" />
                        Recording... Click to stop
                    </span>
                ) : (
                    "Click to start recording"
                )}
            </p>
        </div>
    );
}
