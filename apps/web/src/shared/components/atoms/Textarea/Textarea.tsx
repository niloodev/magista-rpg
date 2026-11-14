import type { TextareaProps } from "./Textarea.types";

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={`magista-input min-h-[100px] w-full resize-y px-3 py-2 font-sans text-base leading-relaxed ${className ?? ""}`}
      {...props}
    />
  );
}
