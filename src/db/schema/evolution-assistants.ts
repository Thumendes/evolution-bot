import { pgTable, pgEnum, uuid, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { assistantVersions } from "./assistant-versions";
import { evolutionInstances } from "./evolution-instances";

export const environmentEnum = pgEnum("environment", ["prod", "staging"]);

export const evolutionAssistants = pgTable("evolution_assistants", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  env: environmentEnum("env").notNull(),
  assistantVersionId: uuid("assistant_version_id")
    .notNull()
    .references(() => assistantVersions.id, { onDelete: "cascade" }),
  evolutionInstanceId: uuid("evolution_instance_id")
    .notNull()
    .references(() => evolutionInstances.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
