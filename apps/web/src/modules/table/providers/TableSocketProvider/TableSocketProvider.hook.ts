"use client";

import type { ICharacterFeaturesEvent, ICharacterImages } from "@magista/shared";
import { useEffect, useState } from "react";

import { createTableSocket } from "@/core/services/socket";
import { useApp } from "@/modules/shell/store";
import { hasActiveSession } from "@/modules/table/services";
import {
  SERVER_DISCONNECT_REASON,
  SESSION_RECHECK_DELAY_MS,
} from "@/modules/table/table.constants";

/**
 * Opens one realtime connection for the table and mirrors presence, roll history and new rolls into the store.
 * Connecting on the next tick avoids opening and killing a socket during React's dev double mount.
 * When the server drops the connection (password changed or logout in another tab), it reconnects if this browser
 * still has a valid session (checking again once, since the renewed cookie may arrive after the drop) and otherwise
 * clears the session so the gate sends the visitor to the login screen.
 */
export function useTableSocketProvider() {
  const [socket] = useState(() => (typeof window === "undefined" ? null : createTableSocket()));
  const setConnection = useApp((state) => state.setConnection);
  const setMembers = useApp((state) => state.setMembers);
  const pushRoll = useApp((state) => state.pushRoll);
  const setRolls = useApp((state) => state.setRolls);
  const setSession = useApp((state) => state.setSession);
  const applyLibraryImages = useApp((state) => state.applyLibraryImages);
  const applySheetImages = useApp((state) => state.applySheetImages);
  const applyLibraryFeatures = useApp((state) => state.applyLibraryFeatures);
  const applySheetFeatures = useApp((state) => state.applySheetFeatures);

  useEffect(() => {
    if (!socket) return;
    let recheckTimer = 0;
    let disposed = false;
    const onConnect = () => setConnection("connected");
    const onDisconnect = () => setConnection("disconnected");
    const resume = async (retry: boolean) => {
      const active = await hasActiveSession();
      if (disposed) return;
      if (active) {
        socket.connect();
        return;
      }
      if (retry)
        recheckTimer = window.setTimeout(() => void resume(false), SESSION_RECHECK_DELAY_MS);
      else setSession(null);
    };
    const onServerDisconnect = (reason: string) => {
      onDisconnect();
      if (reason === SERVER_DISCONNECT_REASON) void resume(true);
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onServerDisconnect);
    socket.on("connect_error", onDisconnect);
    socket.on("presence:update", setMembers);
    socket.on("roll:result", pushRoll);
    socket.on("roll:history", setRolls);
    const onImages = (images: ICharacterImages) => {
      applyLibraryImages(images);
      applySheetImages(images);
    };
    socket.on("character:images", onImages);
    const onFeatures = (event: ICharacterFeaturesEvent) => {
      applyLibraryFeatures(event);
      applySheetFeatures(event);
    };
    socket.on("character:features", onFeatures);
    const connectTimer = window.setTimeout(() => socket.connect(), 0);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onServerDisconnect);
      socket.off("connect_error", onDisconnect);
      socket.off("presence:update", setMembers);
      socket.off("roll:result", pushRoll);
      socket.off("roll:history", setRolls);
      socket.off("character:images", onImages);
      socket.off("character:features", onFeatures);
      window.clearTimeout(connectTimer);
      window.clearTimeout(recheckTimer);
      disposed = true;
      socket.disconnect();
    };
  }, [
    socket,
    setConnection,
    setMembers,
    pushRoll,
    setRolls,
    setSession,
    applyLibraryImages,
    applySheetImages,
    applyLibraryFeatures,
    applySheetFeatures,
  ]);

  return { socket };
}
