import Elysia from "elysia";
import { webhookLogger } from "../lib/logger";

export const webhookRoutes = new Elysia({ prefix: "/webhook" }).post("/evolution", async ({ body }) => {
  webhookLogger.info({ body }, "Received Evolution webhook");

  return { message: "Webhook received" };
});
