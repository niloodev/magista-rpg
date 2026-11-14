import type { RichTextProps } from "./RichText.types";
import { toParagraphs, toSegments } from "./RichText.utils";

export function RichText({ text, className }: RichTextProps) {
  return (
    <div
      className={`space-y-2 font-sans text-[15px] leading-relaxed text-muted-strong ${className ?? ""}`}
    >
      {toParagraphs(text).map((lines, paragraphIndex) => (
        <p key={paragraphIndex}>
          {lines.map((line, lineIndex) => (
            <span key={lineIndex}>
              {lineIndex > 0 && <br />}
              {toSegments(line).map((segment, segmentIndex) =>
                segment.bold ? (
                  <strong key={segmentIndex} className="font-semibold text-foreground">
                    {segment.text}
                  </strong>
                ) : (
                  <span key={segmentIndex}>{segment.text}</span>
                ),
              )}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
