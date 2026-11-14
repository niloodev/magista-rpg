"use client";

import { useEffect, useState } from "react";

import { createTableSocket } from "@/core/services/socket";
import { useApp } from "@/modules/shell/store";

/**
 * Opens one realtime connection for the table and mirrors presence, roll history and new rolls into the store.
 * Connecting on the next tick avoids opening and killing a socket during React's dev double mount.
 */
export function useTableSocketProvider() {
  const [socket] = useState(() => (typeof window === "undefined" ? null : createTableSocket()));
  const setConnection = useApp((state) => state.setConnection);
  const setMembers = useApp((state) => state.setMembers);
  const pushRoll = useApp((state) => state.pushRoll);
  const setRolls = useApp((state) => state.setRolls);

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => setConnection("connected");
    const onDisconnect = () => setConnection("disconnected");
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onDisconnect);
    socket.on("presence:update", setMembers);
    socket.on("roll:result", pushRoll);
    socket.on("roll:history", setRolls);
    const connectTimer = window.setTimeout(() => socket.connect(), 0);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onDisconnect);
      socket.off("presence:update", setMembers);
      socket.off("roll:result", pushRoll);
      socket.off("roll:history", setRolls);
      window.clearTimeout(connectTimer);
      socket.disconnect();
    };
  }, [socket, setConnection, setMembers, pushRoll, setRolls]);

  return { socket };
}
