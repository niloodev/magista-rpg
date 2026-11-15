"use client";

import { createContext, useContext } from "react";

import type { ITreeRowsContext } from "./FolderTree.types";

const TreeRowsContext = createContext<ITreeRowsContext | null>(null);

export const TreeRowsProvider = TreeRowsContext.Provider;

/**
 * What every row of the tree shares (labels, toggle, leaf renderer and the per-row drag store).
 */
export function useTreeRows(): ITreeRowsContext {
  const context = useContext(TreeRowsContext);
  if (!context) throw new Error("useTreeRows must be used inside a FolderTree");
  return context;
}
