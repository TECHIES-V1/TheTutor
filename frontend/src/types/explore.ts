export type Level = "Beginner" | "Intermediate" | "Advanced";

export type Category =
    | "Programming"
    | "Design"
    | "Business"
    | "Marketing"
    | "Data Science"
    | "Photography";

export interface Course {
    id: number;
    title: string;
    description: string;
    category: Category;
    level: Level;
    duration: string;
    rating: number;
    students: number;
    instructor: string;
    tags: string[];
}

export interface FilterState {
    query: string;
    category: string;
    level: string;
    sort: string;
}



export const LEVEL_STYLES: Record<Level, string> = {
    Beginner: "bg-green-400/10 text-green-400 border border-green-400/20",
    Intermediate: "bg-primary/10 text-primary border border-primary/20",
    Advanced: "bg-red-400/10 text-red-400 border border-red-400/20",
};

export const CATEGORIES: string[] = [
    "All",
    "Programming",
    "Design",
    "Business",
    "Marketing",
    "Data Science",
    "Photography",
];

export const LEVELS: string[] = ["All", "Beginner", "Intermediate", "Advanced"];

export const SORT_OPTIONS = [
    { value: "popular", label: "Most Popular" },
    { value: "newest", label: "Newest" },
    { value: "rating", label: "Highest Rated" },
];
