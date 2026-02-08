import pino from "pino";

export const webhookLogger = pino({
  transport: {
    target: "pino-roll",
    options: {
      file: "logs/webhook",
      frequency: "daily",
      mkdir: true,
      dateFormat: "yyyy-MM-dd",
      extension: ".log",
    },
  },
});
