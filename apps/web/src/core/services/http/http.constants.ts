export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export const NETWORK_ERROR = "Não foi possível conectar ao servidor.";

export const CLIENT_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "server";
