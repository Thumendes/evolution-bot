import Elysia from "elysia";

export const webhookRoutes = new Elysia({ prefix: "/webhook" }).post("/evolution", async ({ body }) => {
  console.log("Received Evolution webhook:", body);
  return { message: "Webhook received" };
});
