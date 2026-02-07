import {
  pgTable,
  uuid,
  varchar,
  text,
  real,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const assistantVersions = pgTable("assistant_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  model: varchar("model", { length: 255 }).notNull(),
  instructions: text("instructions").notNull(),
  functions: jsonb("functions"),
  temperature: real("temperature").notNull().default(1.0),
  version: integer("version").notNull().default(1),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
