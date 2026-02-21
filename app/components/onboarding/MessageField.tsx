import { cn } from "@/lib/utils";
import { MessageProps } from "@/types";

export function MessageField({ role, content }: MessageProps) {
    const isUser = role === "user";

    return (
        <div className={cn("flex w-full py-5 space-x-4", isUser && "flex-row-reverse space-x-reverse")}>
            <div className={cn("flex-1 space-y-1.5 overflow-hidden", isUser && "text-right")}>
                <div className={cn(
                    "text-[15px] leading-relaxed whitespace-pre-wrap inline-block",
                    isUser ? "bg-secondary text-secondary-foreground p-3 rounded-2xl rounded-tr-sm" : "text-foreground"
                )}>
                    {content}
                </div>
            </div>
        </div>
    );
}
