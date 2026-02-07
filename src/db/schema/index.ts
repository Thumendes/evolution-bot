import { relations } from "drizzle-orm";

export { organizations } from "./organizations";
export { evolutionInstances } from "./evolution-instances";
export { assistantVersions } from "./assistant-versions";
export { storageFiles } from "./storage-files";
export {
  evolutionAssistants,
  environmentEnum,
} from "./evolution-assistants";

import { organizations } from "./organizations";
import { evolutionInstances } from "./evolution-instances";
import { assistantVersions } from "./assistant-versions";
import { storageFiles } from "./storage-files";
import { evolutionAssistants } from "./evolution-assistants";

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const organizationsRelations = relations(
  organizations,
  ({ many }) => ({
    evolutionInstances: many(evolutionInstances),
    assistantVersions: many(assistantVersions),
    storageFiles: many(storageFiles),
    evolutionAssistants: many(evolutionAssistants),
  }),
);

export const evolutionInstancesRelations = relations(
  evolutionInstances,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [evolutionInstances.organizationId],
      references: [organizations.id],
    }),
    evolutionAssistants: many(evolutionAssistants),
  }),
);

export const assistantVersionsRelations = relations(
  assistantVersions,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [assistantVersions.organizationId],
      references: [organizations.id],
    }),
    evolutionAssistants: many(evolutionAssistants),
  }),
);

export const storageFilesRelations = relations(
  storageFiles,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [storageFiles.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const evolutionAssistantsRelations = relations(
  evolutionAssistants,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [evolutionAssistants.organizationId],
      references: [organizations.id],
    }),
    assistantVersion: one(assistantVersions, {
      fields: [evolutionAssistants.assistantVersionId],
      references: [assistantVersions.id],
    }),
    evolutionInstance: one(evolutionInstances, {
      fields: [evolutionAssistants.evolutionInstanceId],
      references: [evolutionInstances.id],
    }),
  }),
);
