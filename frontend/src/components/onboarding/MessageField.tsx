import { cn } from "@/lib/utils";
import { MessageProps } from "@/types";

export function MessageField({ role, content }: MessageProps) {
    const isUser = role === "user";

    return (
        <div className={cn("flex w-full py-5 space-x-4", isUser && "flex-row-reverse space-x-reverse")}>
            <div className={cn("flex-1 space-y-1.5 overflow-hidden", isUser && "text-right")}>
                <div className={cn(
                    "inline-block max-w-[85%] md:max-w-[75%] whitespace-pre-wrap text-[15px] leading-relaxed",
                    isUser
                        ? "skeuo-gold rounded-2xl rounded-tr-sm p-3 text-left"
                        : "neo-inset rounded-2xl rounded-tl-sm px-4 py-3 text-foreground"
                )}>
                    {content}
                </div>
            </div>
        </div>
    );
}
