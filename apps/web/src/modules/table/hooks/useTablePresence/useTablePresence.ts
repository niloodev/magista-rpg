"use client";

import type { IPresenceMember } from "@magista/shared";
import { useEffect, useState } from "react";

import { createTableSocket } from "@/core/services/socket";
import type { ConnectionStatus } from "@/modules/table/table.types";

/**
 * Opens the realtime connection to the main table and tracks who is online.
 */
export function useTablePresence() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [members, setMembers] = useState<IPresenceMember[]>([]);

  useEffect(() => {
    const socket = createTableSocket();
    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("disconnected"));
    socket.on("presence:update", setMembers);
    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  return { status, members };
}
