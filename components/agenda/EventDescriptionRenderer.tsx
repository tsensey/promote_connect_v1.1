"use client";

import DOMPurify from "dompurify";

interface EventDescriptionRendererProps {
  html: string | null;
  fallback: string;
}

export function EventDescriptionRenderer({
  html,
  fallback,
}: EventDescriptionRendererProps) {
  if (!html) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground/80">
        {fallback}
      </p>
    );
  }

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote",
      "a",
      "span",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground/80 prose-strong:text-foreground prose-a:text-primary prose-code:text-primary prose-li:text-muted-foreground/80"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
