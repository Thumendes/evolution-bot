import { openapi } from "@elysiajs/openapi";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { Elysia } from "elysia";
import { organizationRoutes } from "./routes/organizations";
import { evolutionInstanceRoutes } from "./routes/evolution-instances";
import { assistantVersionRoutes } from "./routes/assistant-versions";
import { storageFileRoutes } from "./routes/storage-files";
import { evolutionAssistantRoutes } from "./routes/evolution-assistants";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { webhookRoutes } from "./routes/webhook";

const app = new Elysia()
  .use(openapi())
  .use(
    opentelemetry({
      spanProcessors: [
        new BatchSpanProcessor(
          new OTLPTraceExporter({
            url: "https://api.axiom.co/v1/traces",
            headers: {
              Authorization: `Bearer ${Bun.env.AXIOM_TOKEN}`,
              "X-Axiom-Dataset": Bun.env.AXIOM_DATASET!,
            },
          }),
        ),
      ],
    }),
  )
  .onError(({ error, status }) => {
    if (error instanceof Error && "code" in error && (error as any).code === "23505") {
      return status(409, { message: "Resource already exists (unique constraint violation)" });
    }

    if (error instanceof Error && "code" in error && (error as any).code === "23503") {
      return status(400, { message: "Referenced resource does not exist" });
    }
  })
  .use(organizationRoutes)
  .use(evolutionInstanceRoutes)
  .use(assistantVersionRoutes)
  .use(storageFileRoutes)
  .use(evolutionAssistantRoutes)
  .use(webhookRoutes)
  .get("/", () => "Hello Elysia")
  .listen(3000);

console.log(`✨📞 Server is running at ${app.server?.hostname}:${app.server?.port}`);
