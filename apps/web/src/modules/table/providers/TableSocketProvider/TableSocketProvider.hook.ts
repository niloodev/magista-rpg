"use client";

import {
  LATENCY_PING_INTERVAL_MS,
  LATENCY_PING_MIN_GAP_MS,
  ROLL_REVEAL_DELAY_MS,
  type ICharacterFeaturesEvent,
  type ICharacterImages,
  type IRollPending,
  type IRollResult,
} from "@magista/shared";
import { useEffect, useState } from "react";

import { createTableSocket } from "@/core/services/socket";
import { useApp } from "@/modules/shell/store";
import { hasActiveSession } from "@/modules/table/services";
import {
  LATENCY_PING_TIMEOUT_MS,
  PENDING_ROLL_GRACE_MS,
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
  const setLatency = useApp((state) => state.setLatency);
  const setMembers = useApp((state) => state.setMembers);
  const pushRoll = useApp((state) => state.pushRoll);
  const setRolls = useApp((state) => state.setRolls);
  const addPendingRoll = useApp((state) => state.addPendingRoll);
  const dropPendingRoll = useApp((state) => state.dropPendingRoll);
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
    const pendingTimers = new Map<string, number>();
    const onResult = (roll: IRollResult) => {
      window.clearTimeout(pendingTimers.get(roll.id));
      pendingTimers.delete(roll.id);
      pushRoll(roll);
    };
    socket.on("roll:result", onResult);
    const onPending = (pending: IRollPending) => {
      addPendingRoll(pending);
      window.clearTimeout(pendingTimers.get(pending.id));
      pendingTimers.set(
        pending.id,
        window.setTimeout(() => {
          pendingTimers.delete(pending.id);
          dropPendingRoll(pending.id);
        }, ROLL_REVEAL_DELAY_MS + PENDING_ROLL_GRACE_MS),
      );
    };
    socket.on("roll:pending", onPending);
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
      socket.off("roll:result", onResult);
      socket.off("roll:pending", onPending);
      for (const timer of pendingTimers.values()) window.clearTimeout(timer);
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
    addPendingRoll,
    dropPendingRoll,
    setSession,
    applyLibraryImages,
    applySheetImages,
    applyLibraryFeatures,
    applySheetFeatures,
  ]);

  useEffect(() => {
    if (!socket) return;
    let lastSent = Number.NEGATIVE_INFINITY;
    let sequence = 0;
    const measure = () => {
      const started = performance.now();
      if (!socket.connected || started - lastSent < LATENCY_PING_MIN_GAP_MS) return;
      lastSent = started;
      const current = ++sequence;
      socket.timeout(LATENCY_PING_TIMEOUT_MS).emit("presence:ping", (error: Error | null) => {
        if (current !== sequence || !socket.connected) return;
        setLatency(error ? null : Math.round(performance.now() - started));
      });
    };
    socket.on("connect", measure);
    const timer = window.setInterval(measure, LATENCY_PING_INTERVAL_MS);
    return () => {
      socket.off("connect", measure);
      window.clearInterval(timer);
    };
  }, [socket, setLatency]);

  return { socket };
}
