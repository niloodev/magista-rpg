"use client";

import { createContext, useContext } from "react";

import type { TableSocket } from "@/core/services/socket";

export const TableSocketContext = createContext<TableSocket | null>(null);

/**
 * Returns the live table socket, or null before it is created. Must be used under TableSocketProvider.
 */
export function useTableSocket(): TableSocket | null {
  return useContext(TableSocketContext);
}
