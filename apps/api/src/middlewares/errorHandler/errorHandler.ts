import type { NextFunction, Request, Response } from "express";

function statusOf(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const value = "status" in error ? error.status : "statusCode" in error ? error.statusCode : null;
  return typeof value === "number" ? value : null;
}

/**
 * Last-resort Express error handler that never leaks internals to the client.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: "Requisição inválida." });
    return;
  }
  const status = statusOf(error);
  if (status && status < 500) {
    res.status(status).json({ error: status === 404 ? "Não encontrado." : "Requisição inválida." });
    return;
  }
  console.error("unhandled error:", error);
  res.status(500).json({ error: "Erro interno do servidor." });
}

/**
 * Responds 404 for unknown routes.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Rota não encontrada." });
}
