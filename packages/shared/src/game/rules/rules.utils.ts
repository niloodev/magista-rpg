/**
 * Joins expression parts into "a + b - c", skipping empty strings and zero numbers.
 */
export function joinExpression(parts: (string | number)[]): string {
  return parts.reduce<string>((expression, part) => {
    if (part === "" || part === 0) return expression;
    if (!expression) return String(part);
    if (typeof part === "number") return `${expression} ${part < 0 ? "-" : "+"} ${Math.abs(part)}`;
    return `${expression} + ${part}`;
  }, "");
}

/**
 * Formats a modifier with an explicit plus sign when positive.
 */
export function formatModifier(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
