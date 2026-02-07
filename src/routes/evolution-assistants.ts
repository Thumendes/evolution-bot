import { Elysia, t } from "elysia";
import { eq, and, count } from "drizzle-orm";
import { organizations, evolutionAssistants, assistantVersions, evolutionInstances } from "../db/schema";
import { paginationQuery, paginationMeta } from "../lib/pagination";
import { db } from "../db";

export const evolutionAssistantRoutes = new Elysia({
  prefix: "/organizations/:orgId/evolution-assistants",
})
  // ── Resolve: validate org exists ──────────────────────────────────────
  .resolve(async ({ params, status }) => {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, (params as { orgId: string }).orgId),
    });
    if (!org) return status(404, { message: "Organization not found" });
    return { org };
  })

  // ── List ──────────────────────────────────────────────────────────────
  .get(
    "/",
    async ({ params, query }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const offset = (page - 1) * limit;

      const conditions = [eq(evolutionAssistants.organizationId, params.orgId)];
      if (query.env) {
        conditions.push(eq(evolutionAssistants.env, query.env));
      }
      const where = and(...conditions);

      const [totalResult] = await db.select({ count: count() }).from(evolutionAssistants).where(where);

      const data = await db.query.evolutionAssistants.findMany({
        where,
        with: {
          assistantVersion: true,
          evolutionInstance: true,
        },
        limit,
        offset,
        orderBy: (ea, { desc }) => [desc(ea.createdAt)],
      });

      return { data, meta: paginationMeta(Number(totalResult.count), page, limit) };
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      query: t.Object({
        ...paginationQuery,
        env: t.Optional(t.UnionEnum(["prod", "staging"])),
      }),
      detail: { tags: ["Evolution Assistants"], summary: "List evolution assistants" },
    },
  )

  // ── Create ────────────────────────────────────────────────────────────
  .post(
    "/",
    async ({ params, body, status }) => {
      // Validate assistantVersionId belongs to same org
      const version = await db.query.assistantVersions.findFirst({
        where: and(
          eq(assistantVersions.id, body.assistantVersionId),
          eq(assistantVersions.organizationId, params.orgId),
        ),
      });
      if (!version) {
        return status(400, {
          message: "Assistant version not found in this organization",
        });
      }

      // Validate evolutionInstanceId belongs to same org
      const instance = await db.query.evolutionInstances.findFirst({
        where: and(
          eq(evolutionInstances.id, body.evolutionInstanceId),
          eq(evolutionInstances.organizationId, params.orgId),
        ),
      });
      if (!instance) {
        return status(400, {
          message: "Evolution instance not found in this organization",
        });
      }

      const [created] = await db
        .insert(evolutionAssistants)
        .values({
          organizationId: params.orgId,
          env: body.env,
          assistantVersionId: body.assistantVersionId,
          evolutionInstanceId: body.evolutionInstanceId,
        })
        .returning();

      return created;
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      body: t.Object({
        env: t.UnionEnum(["prod", "staging"]),
        assistantVersionId: t.String({ format: "uuid" }),
        evolutionInstanceId: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Evolution Assistants"], summary: "Create evolution assistant" },
    },
  )

  // ── Get by ID ─────────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params, status }) => {
      const record = await db.query.evolutionAssistants.findFirst({
        where: and(eq(evolutionAssistants.id, params.id), eq(evolutionAssistants.organizationId, params.orgId)),
        with: {
          assistantVersion: true,
          evolutionInstance: true,
        },
      });

      if (!record) return status(404, { message: "Evolution assistant not found" });

      return record;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Evolution Assistants"], summary: "Get evolution assistant by ID" },
    },
  )

  // ── Update ────────────────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body, status }) => {
      if (body.assistantVersionId) {
        const version = await db.query.assistantVersions.findFirst({
          where: and(
            eq(assistantVersions.id, body.assistantVersionId),
            eq(assistantVersions.organizationId, params.orgId),
          ),
        });
        if (!version) {
          return status(400, {
            message: "Assistant version not found in this organization",
          });
        }
      }

      if (body.evolutionInstanceId) {
        const instance = await db.query.evolutionInstances.findFirst({
          where: and(
            eq(evolutionInstances.id, body.evolutionInstanceId),
            eq(evolutionInstances.organizationId, params.orgId),
          ),
        });
        if (!instance) {
          return status(400, {
            message: "Evolution instance not found in this organization",
          });
        }
      }

      const [updated] = await db
        .update(evolutionAssistants)
        .set({
          ...(body.env !== undefined && { env: body.env }),
          ...(body.assistantVersionId !== undefined && {
            assistantVersionId: body.assistantVersionId,
          }),
          ...(body.evolutionInstanceId !== undefined && {
            evolutionInstanceId: body.evolutionInstanceId,
          }),
        })
        .where(and(eq(evolutionAssistants.id, params.id), eq(evolutionAssistants.organizationId, params.orgId)))
        .returning();

      if (!updated) return status(404, { message: "Evolution assistant not found" });

      return updated;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        env: t.Optional(t.UnionEnum(["prod", "staging"])),
        assistantVersionId: t.Optional(t.String({ format: "uuid" })),
        evolutionInstanceId: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: { tags: ["Evolution Assistants"], summary: "Update evolution assistant" },
    },
  )

  // ── Delete ────────────────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params, status }) => {
      const [deleted] = await db
        .delete(evolutionAssistants)
        .where(and(eq(evolutionAssistants.id, params.id), eq(evolutionAssistants.organizationId, params.orgId)))
        .returning();

      if (!deleted) return status(404, { message: "Evolution assistant not found" });

      return deleted;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Evolution Assistants"], summary: "Delete evolution assistant" },
    },
  );
