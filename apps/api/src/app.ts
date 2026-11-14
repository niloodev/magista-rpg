import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import { getEnv } from "@/core/services/env";
import { getMediaRoot, MEDIA_ROUTE } from "@/core/services/media";
import { apiRateLimit, errorHandler, notFoundHandler } from "@/middlewares";
import {
  accountRoutes,
  authRoutes,
  characterRoutes,
  folderRoutes,
  healthRoutes,
  libraryRoutes,
} from "@/routes";

/**
 * Builds the Express application with every HTTP route.
 */
export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", getEnv().TRUST_PROXY);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
  app.use(apiRateLimit);
  app.use(cors({ origin: getEnv().WEB_ORIGIN, credentials: true }));
  app.use(
    MEDIA_ROUTE,
    express.static(getMediaRoot(), {
      maxAge: "7d",
      fallthrough: false,
      setHeaders: (res) => res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/health", healthRoutes);
  app.use("/auth", authRoutes);
  app.use("/characters", characterRoutes);
  app.use("/folders", folderRoutes);
  app.use("/library", libraryRoutes);
  app.use("/accounts", accountRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
