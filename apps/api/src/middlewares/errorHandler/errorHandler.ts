import type { NextFunction, Request, Response } from "express";

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
  console.error("unhandled error:", error);
  res.status(500).json({ error: "Erro interno do servidor." });
}

/**
 * Responds 404 for unknown routes.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Rota não encontrada." });
}
