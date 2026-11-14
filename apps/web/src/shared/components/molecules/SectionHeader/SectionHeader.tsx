import { Icon, Text } from "@/shared/components/atoms";

import type { SectionHeaderProps } from "./SectionHeader.types";

export function SectionHeader({ title, icon, aside, as = "h2" }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-2">
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} size={14} className="text-primary" />}
        <Text variant="h3" as={as}>
          {title}
        </Text>
      </div>
      {aside}
    </div>
  );
}
