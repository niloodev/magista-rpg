import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";

import { getEnv } from "@/core/services/env";
import { errorHandler, notFoundHandler } from "@/middlewares";
import { authRoutes, healthRoutes } from "@/routes";

/**
 * Builds the Express application with every HTTP route.
 */
export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: getEnv().WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/health", healthRoutes);
  app.use("/auth", authRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
