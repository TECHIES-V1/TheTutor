"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <div className="neo-inset relative flex flex-1 items-center rounded-xl">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
                id="explore-search"
                type="text"
                placeholder="Search courses, topics, or keywords…"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 w-full bg-transparent pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 rounded-xl transition-all"
            />
        </div>
    );
}
