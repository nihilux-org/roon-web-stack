import { pino } from "pino";
import * as process from "process";

export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? "info",
  formatters: {
    bindings: (bindings) => ({ hostname: bindings.hostname as string }),
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
