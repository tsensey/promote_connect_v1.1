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
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "colspan", "rowspan", "style"],
  });

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground/80 prose-strong:text-foreground prose-a:text-primary prose-code:text-primary prose-li:text-muted-foreground/80
        prose-table:border-collapse prose-table:border prose-table:border-border/60
        prose-th:border prose-th:border-border/60 prose-th:bg-muted/30 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-sm prose-th:font-semibold
        prose-td:border prose-td:border-border/60 prose-td:px-3 prose-td:py-2 prose-td:text-sm"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
