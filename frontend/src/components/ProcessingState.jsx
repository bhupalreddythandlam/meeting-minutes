import { Brain, FileSearch, Wand2, CheckCircle2 } from "lucide-react";

const STEPS = [
    { label: "Uploading", icon: FileSearch, description: "Preparing your file..." },
    { label: "Transcribing", icon: Wand2, description: "Converting speech to text..." },
    { label: "Analyzing", icon: Brain, description: "AI is generating insights..." },
    { label: "Complete", icon: CheckCircle2, description: "Results ready!" },
];

export default function ProcessingState({ currentStep = 0 }) {
    return (
        <div className="flex flex-col items-center gap-8 py-12 animate-slide-up">
            {/* Animated brain icon */}
            <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                    <Brain className="w-12 h-12 text-primary animate-pulse-glow" />
                </div>
                <div className="absolute -inset-2 rounded-3xl bg-primary/10 animate-ping opacity-20" />
            </div>

            {/* Progress steps */}
            <div className="flex items-center gap-3 w-full max-w-md">
                {STEPS.map((step, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="flex items-center w-full">
                            <div
                                className={`step-dot mx-auto ${i < currentStep ? "completed" : i === currentStep ? "active" : ""
                                    }`}
                            />
                            {i < STEPS.length - 1 && (
                                <div
                                    className={`flex-1 h-[2px] transition-all duration-500 ${i < currentStep ? "bg-green-500" : "bg-muted"
                                        }`}
                                />
                            )}
                        </div>
                        <span
                            className={`text-xs font-medium transition-colors ${i <= currentStep ? "text-foreground" : "text-muted-foreground"
                                }`}
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Current step description */}
            <p className="text-muted-foreground text-center">
                {STEPS[Math.min(currentStep, STEPS.length - 1)].description}
            </p>

            {/* Skeleton loaders */}
            {currentStep < 3 && (
                <div className="w-full max-w-2xl space-y-4 mt-4">
                    <div className="h-6 rounded-lg shimmer-bg w-3/4" />
                    <div className="h-4 rounded-lg shimmer-bg w-full" />
                    <div className="h-4 rounded-lg shimmer-bg w-5/6" />
                    <div className="h-4 rounded-lg shimmer-bg w-4/6" />
                    <div className="h-20 rounded-xl shimmer-bg w-full mt-6" />
                </div>
            )}
        </div>
    );
}
