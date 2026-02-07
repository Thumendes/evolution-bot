import { createFetch, createSchema } from "@better-fetch/fetch";
import { type } from "arktype";

type EvolutionServiceParams = {
  url: string;
  instance?: string;
  hash?: string;
};

const schema = createSchema({
  // Instances
  "@post/instance/create": { input: type({ name: "string", integration: "string" }) },
  "/instance/fetchInstances": { output: type({}) },
  "/instances/connectionState/:instance": { output: type({}) },
});

export function evolutionService(options: EvolutionServiceParams) {
  const $fetch = createFetch({
    baseURL: options.url,
    schema,
    headers: { apiKey: options.hash ?? "" },
    throw: true,
  });

  return {
    instance: {
      create: async (name: string) => {
        const response = await $fetch(`@post/instance/create`, { body: { name, integration: "WHATSAPP-BAILEYS" } });
        return response;
      },
      fetch: async () => {
        const response = await $fetch("/instance/fetchInstances");
        return response;
      },
      status: async (instance: string) => {
        const response = await $fetch(`/instances/connectionState/${instance}`);
        return response;
      },
    },
  };
}
