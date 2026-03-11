import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";

export default function FileUploader({ accept, label, icon: Icon = Upload, onFileSelect }) {
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) {
                setSelectedFile(file);
                onFileSelect?.(file);
            }
        },
        [onFileSelect]
    );

    const handleClick = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                setSelectedFile(file);
                onFileSelect?.(file);
            }
        };
        input.click();
    }, [accept, onFileSelect]);

    const clearFile = useCallback((e) => {
        e.stopPropagation();
        setSelectedFile(null);
    }, []);

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / 1048576).toFixed(1) + " MB";
    };

    return (
        <div
            className={`drop-zone rounded-2xl p-8 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 min-h-[220px] ${dragOver ? "drag-over" : ""
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            {selectedFile ? (
                <div className="flex flex-col items-center gap-3 animate-slide-up">
                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
                        <FileText className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-foreground truncate max-w-[240px]">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{formatSize(selectedFile.size)}</p>
                    </div>
                    <button
                        onClick={clearFile}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors mt-1"
                    >
                        <X className="w-3.5 h-3.5" />
                        Remove
                    </button>
                </div>
            ) : (
                <>
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-accent transition-colors">
                        <Icon className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <p className="font-medium text-foreground">{label}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Drag & drop or click to browse
                        </p>
                    </div>
                    <span className="text-xs text-muted-foreground/60 mt-1">
                        Accepted: {accept}
                    </span>
                </>
            )}
        </div>
    );
}
