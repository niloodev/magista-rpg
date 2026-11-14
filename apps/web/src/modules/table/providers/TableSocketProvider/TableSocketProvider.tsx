"use client";

import { TableSocketContext } from "./TableSocketProvider.context";
import { useTableSocketProvider } from "./TableSocketProvider.hook";
import type { TableSocketProviderProps } from "./TableSocketProvider.types";

export function TableSocketProvider({ children }: TableSocketProviderProps) {
  const { socket } = useTableSocketProvider();
  return <TableSocketContext.Provider value={socket}>{children}</TableSocketContext.Provider>;
}
