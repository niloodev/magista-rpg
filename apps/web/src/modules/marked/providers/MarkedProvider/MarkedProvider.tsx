"use client";

import { MarkedProposalModal } from "@/modules/marked/components/organisms";

import { useMarkedProvider } from "./MarkedProvider.hook";
import type { MarkedProviderProps } from "./MarkedProvider.types";

export function MarkedProvider({ children }: MarkedProviderProps) {
  useMarkedProvider();
  return (
    <>
      {children}
      <MarkedProposalModal />
    </>
  );
}
