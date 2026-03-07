"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const baseComponents: Components = {
  h1: (props) => <h1 className="mt-6 mb-2 font-playfair text-xl font-bold text-foreground" {...props} />,
  h2: (props) => <h2 className="mt-5 mb-2 font-playfair text-lg font-bold text-foreground" {...props} />,
  h3: (props) => <h3 className="mt-4 mb-2 text-base font-semibold text-foreground" {...props} />,
  h4: (props) => <h4 className="mt-3 mb-1 text-sm font-semibold text-foreground" {...props} />,
  p: (props) => <p className="mb-3 last:mb-0" {...props} />,
  ul: (props) => <ul className="mb-3 ml-6 list-disc space-y-1" {...props} />,
  ol: (props) => <ol className="mb-3 ml-6 list-decimal space-y-1" {...props} />,
  li: (props) => <li {...props} />,
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
  em: (props) => <em {...props} />,
  a: (props) => (
    <a className="text-primary underline underline-offset-4 hover:text-primary/80" target="_blank" rel="noreferrer" {...props} />
  ),
  blockquote: (props) => (
    <blockquote className="my-3 border-l-4 border-primary/50 pl-4 italic text-muted-foreground" {...props} />
  ),
  hr: () => <hr className="my-4 border-border/50" />,
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="my-3 overflow-x-auto rounded-lg bg-card border border-border/60 p-3 text-xs leading-relaxed">
          <code className={className} {...props}>{children}</code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-card border border-border/40 px-1.5 py-0.5 text-xs text-primary" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
};

const compactComponents: Components = {
  ...baseComponents,
  h1: (props) => <h1 className="mt-3 mb-1 text-sm font-bold text-foreground" {...props} />,
  h2: (props) => <h2 className="mt-2.5 mb-1 text-sm font-bold text-foreground" {...props} />,
  h3: (props) => <h3 className="mt-2 mb-1 text-[13px] font-semibold text-foreground" {...props} />,
  h4: (props) => <h4 className="mt-1.5 mb-0.5 text-[13px] font-semibold text-foreground" {...props} />,
  p: (props) => <p className="mb-2 last:mb-0" {...props} />,
  ul: (props) => <ul className="mb-2 ml-5 list-disc space-y-0.5" {...props} />,
  ol: (props) => <ol className="mb-2 ml-5 list-decimal space-y-0.5" {...props} />,
};

interface Props {
  children: string;
  compact?: boolean;
}

export function MarkdownContent({ children, compact }: Props) {
  return (
    <ReactMarkdown components={compact ? compactComponents : baseComponents}>
      {children}
    </ReactMarkdown>
  );
}
