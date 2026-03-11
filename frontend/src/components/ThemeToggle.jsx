import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ dark, onToggle }) {
    return (
        <button
            onClick={onToggle}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-secondary hover:bg-accent transition-all duration-300 group"
            aria-label="Toggle theme"
        >
            {dark ? (
                <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
                <Moon className="w-5 h-5 text-primary group-hover:-rotate-12 transition-transform duration-300" />
            )}
        </button>
    );
}
