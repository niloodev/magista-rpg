import { Router } from "express";

import { accountController } from "@/core/controllers/account";
import { requireAuth } from "@/middlewares";
import { sendResult, viewerOf, type AuthedResponse } from "@/routes/routes.utils";
import { ACCOUNT_ERROR_STATUS } from "./accounts.routes.constants";

export const accountRoutes = Router();

accountRoutes.use(requireAuth);

accountRoutes.get("/", async (_req, res: AuthedResponse) => {
  sendResult(res, await accountController.listAccounts(viewerOf(res)), ACCOUNT_ERROR_STATUS);
});

accountRoutes.post("/", async (req, res: AuthedResponse) => {
  res.setHeader("Cache-Control", "no-store");
  const result = await accountController.createAccount(viewerOf(res), req.body);
  sendResult(res, result, ACCOUNT_ERROR_STATUS, 201);
});
