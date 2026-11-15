import { pipeline } from "node:stream";

import { Router } from "express";

import { isMediaKey, MEDIA_CACHE_CONTROL, mediaStorage } from "@/core/services/media";

import { MEDIA_NOT_FOUND } from "./media.routes.constants";

export const mediaRoutes = Router();

mediaRoutes.get("/{*key}", async (req, res, next) => {
  const raw = req.params.key;
  const key = Array.isArray(raw) ? raw.join("/") : "";
  if (!isMediaKey(key)) {
    res.status(404).json(MEDIA_NOT_FOUND);
    return;
  }
  try {
    const object = await mediaStorage.getObject(key);
    if (!object) {
      res.status(404).json(MEDIA_NOT_FOUND);
      return;
    }
    res.setHeader("Content-Type", object.contentType);
    if (object.contentLength !== undefined) res.setHeader("Content-Length", object.contentLength);
    res.setHeader("Cache-Control", MEDIA_CACHE_CONTROL);
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    pipeline(object.body, res, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    next(error);
  }
});
