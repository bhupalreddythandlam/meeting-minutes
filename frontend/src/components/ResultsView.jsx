import { useState } from "react";
import {
    Copy,
    Download,
    CheckCircle2,
    ScrollText,
    Lightbulb,
    ListChecks,
    ChevronRight,
    Check,
} from "lucide-react";
import { exportPDF } from "../lib/api";

export default function ResultsView({ results, transcript }) {
    const [copied, setCopied] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [activePanel, setActivePanel] = useState("summary");

    if (!results) return null;

    const handleCopy = async () => {
        const text = formatResultsAsText(results, transcript);
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            await exportPDF(results, transcript);
        } catch (err) {
            console.error("PDF export error:", err);
            alert("Failed to export PDF. Make sure the backend is running.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto animate-slide-up">
            {/* Title */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold gradient-text">{results.title || "Summary"}</h2>
                    <p className="text-sm text-muted-foreground mt-1">AI-generated analysis complete</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-accent transition-all text-sm font-medium"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all text-sm font-medium shadow-md shadow-primary/20"
                    >
                        <Download className="w-4 h-4" />
                        {exporting ? "Exporting..." : "PDF"}
                    </button>
                </div>
            </div>

            {/* Panel toggle for mobile */}
            <div className="flex gap-2 mb-4 p-1 bg-muted rounded-xl lg:hidden">
                <button
                    onClick={() => setActivePanel("summary")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activePanel === "summary" ? "bg-card shadow text-foreground" : "text-muted-foreground"
                        }`}
                >
                    Summary
                </button>
                <button
                    onClick={() => setActivePanel("transcript")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activePanel === "transcript" ? "bg-card shadow text-foreground" : "text-muted-foreground"
                        }`}
                >
                    Transcript
                </button>
            </div>

            {/* Split view */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Transcript */}
                <div
                    className={`lg:col-span-2 ${activePanel === "transcript" ? "block" : "hidden lg:block"
                        }`}
                >
                    <div className="glass-card rounded-2xl p-5 h-full">
                        <div className="flex items-center gap-2 mb-4">
                            <ScrollText className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Full Transcript</h3>
                        </div>
                        <div className="prose prose-sm max-w-none overflow-y-auto max-h-[600px] pr-2">
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                {transcript || "No transcript available."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: AI Summary */}
                <div
                    className={`lg:col-span-3 space-y-5 ${activePanel === "summary" ? "block" : "hidden lg:block"
                        }`}
                >
                    {/* Summary */}
                    <div className="glass-card rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <h3 className="font-semibold">High-Level Summary</h3>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                            {results.summary}
                        </p>
                    </div>

                    {/* Key Takeaways */}
                    {results.keyTakeaways?.length > 0 && (
                        <div className="glass-card rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                <h3 className="font-semibold">Key Takeaways</h3>
                            </div>
                            <ul className="space-y-2.5">
                                {results.keyTakeaways.map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-3 text-sm text-foreground/80 animate-slide-up"
                                        style={{ animationDelay: `${i * 60}ms` }}
                                    >
                                        <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Action Items */}
                    {results.actionItems?.length > 0 && (
                        <div className="glass-card rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <ListChecks className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold">Action Items</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-primary/20">
                                            <th className="text-left py-3 px-3 font-semibold text-foreground bg-primary/5 rounded-tl-lg">
                                                Task
                                            </th>
                                            <th className="text-left py-3 px-3 font-semibold text-foreground bg-primary/5">
                                                Owner
                                            </th>
                                            <th className="text-left py-3 px-3 font-semibold text-foreground bg-primary/5 rounded-tr-lg">
                                                Priority
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.actionItems.map((item, i) => (
                                            <tr
                                                key={i}
                                                className="border-b border-border/50 hover:bg-accent/50 transition-colors animate-slide-up"
                                                style={{ animationDelay: `${i * 80}ms` }}
                                            >
                                                <td className="py-3 px-3 text-foreground/90 font-medium">
                                                    {item.task}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                        {item.owner || "Unassigned"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <PriorityBadge priority={item.priority} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PriorityBadge({ priority }) {
    const p = (priority || "Medium").toLowerCase();
    const colors = {
        high: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
        medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
        low: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
    };
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors[p] || colors.medium
                }`}
        >
            {priority || "Medium"}
        </span>
    );
}

function formatResultsAsText(results, transcript) {
    let text = `# ${results.title || "Summary"}\n\n`;
    text += `## Summary\n${results.summary}\n\n`;
    text += `## Key Takeaways\n`;
    (results.keyTakeaways || []).forEach((t) => {
        text += `• ${t}\n`;
    });
    text += `\n## Action Items\n`;
    (results.actionItems || []).forEach((a) => {
        text += `- [${a.priority}] ${a.task} (Owner: ${a.owner || "Unassigned"})\n`;
    });
    text += `\n## Full Transcript\n${transcript || "N/A"}\n`;
    return text;
}
