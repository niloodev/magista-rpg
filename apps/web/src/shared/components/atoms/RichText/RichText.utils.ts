import type { RichTextSegment } from "./RichText.types";

/**
 * Splits a line on **bold** markers (as typed in the Roll20 sheet) into plain and bold segments.
 */
export function toSegments(line: string): RichTextSegment[] {
  return line
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}

/**
 * Splits text into paragraphs on blank lines, keeping single line breaks inside a paragraph.
 */
export function toParagraphs(text: string): string[][] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.split("\n"))
    .filter((lines) => lines.some((line) => line.trim() !== ""));
}
