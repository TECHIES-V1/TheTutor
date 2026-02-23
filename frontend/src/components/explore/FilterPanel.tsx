"use client";

import { CATEGORIES, LEVELS, SORT_OPTIONS } from "@/types/explore";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FilterPanelProps {
    category: string;
    level: string;
    sort: string;
    onCategoryChange: (value: string) => void;
    onLevelChange: (value: string) => void;
    onSortChange: (value: string) => void;
}

const triggerClass =
    "neo-inset h-10 rounded-xl border-0 bg-transparent px-3 text-sm text-foreground cursor-pointer focus:ring-1 focus:ring-primary/50 transition-all transition-shadow";

export function FilterPanel({
    category,
    level,
    sort,
    onCategoryChange,
    onLevelChange,
    onSortChange,
}: FilterPanelProps) {
    return (
        <div className="flex items-center gap-3">
            {/* Category */}
            <Select value={category} onValueChange={onCategoryChange}>
                <SelectTrigger className={triggerClass} style={{ width: "160px" }}>
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="border-primary/20 bg-[#111] text-foreground">
                    {CATEGORIES.map((c) => (
                        <SelectItem
                            key={c}
                            value={c}
                            className="focus:bg-primary/10 focus:text-primary"
                        >
                            {c === "All" ? "All Categories" : c}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Level */}
            <Select value={level} onValueChange={onLevelChange}>
                <SelectTrigger className={triggerClass} style={{ width: "135px" }}>
                    <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent className="border-primary/20 bg-[#111] text-foreground">
                    {LEVELS.map((l) => (
                        <SelectItem
                            key={l}
                            value={l}
                            className="focus:bg-primary/10 focus:text-primary"
                        >
                            {l === "All" ? "All Levels" : l}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sort} onValueChange={onSortChange}>
                <SelectTrigger className={triggerClass} style={{ width: "160px" }}>
                    <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="border-primary/20 bg-[#111] text-foreground">
                    {SORT_OPTIONS.map((o) => (
                        <SelectItem
                            key={o.value}
                            value={o.value}
                            className="focus:bg-primary/10 focus:text-primary"
                        >
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
