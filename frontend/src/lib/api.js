const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || "Upload failed");
    }

    return response.json();
}

export async function transcribeMedia(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/api/transcribe`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Transcription failed" }));
        throw new Error(err.detail || "Transcription failed");
    }

    return response.json();
}

export async function processText(text) {
    const formData = new FormData();
    formData.append("text", text);

    const response = await fetch(`${API_BASE}/api/process`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Processing failed" }));
        throw new Error(err.detail || "Processing failed");
    }

    return response.json();
}

export async function exportPDF(results, transcript) {
    const formData = new FormData();
    formData.append("title", results.title || "");
    formData.append("summary", results.summary || "");
    formData.append("keyTakeaways", JSON.stringify(results.keyTakeaways || []));
    formData.append("actionItems", JSON.stringify(results.actionItems || []));
    formData.append("transcript", transcript || "");

    const response = await fetch(`${API_BASE}/api/export-pdf`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("PDF export failed");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-minutes-${(results.title || "export").slice(0, 30).replace(/\s+/g, "-")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function healthCheck() {
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        return response.json();
    } catch {
        return { status: "error", openai_configured: false };
    }
}
