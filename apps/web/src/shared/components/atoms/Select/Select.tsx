import type { SelectProps } from "./Select.types";

export function Select({
  value,
  onValueChange,
  options = [],
  groups = [],
  compact = false,
  className,
  ...props
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={`magista-input cursor-pointer font-sans [&>option]:bg-void-800 [&_optgroup]:bg-void-800 ${compact ? "h-8 px-2 text-xs" : "w-full px-4 py-3 text-base"} ${className ?? ""}`}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
