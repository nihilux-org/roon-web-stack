import { LoggerOptions, pino } from "pino";
import * as process from "process";

export const buildLoggerOptions: (minLevel?: pino.Level) => LoggerOptions | undefined = (minLevel?: pino.Level) => {
  const level = process.env["LOG_LEVEL"] ?? "info";
  let shouldConfigureLogger = true;
  if (minLevel) {
    switch (minLevel) {
      case "debug":
        shouldConfigureLogger = level === "debug" || level === "trace";
        break;
      case "info":
        shouldConfigureLogger = level === "debug" || level === "trace" || level === "info";
        break;
      case "trace":
        shouldConfigureLogger = level === "trace";
        break;
      case "warn":
        shouldConfigureLogger = level === "debug" || level === "trace" || level === "info" || level === "warn";
        break;
    }
  }
  if (shouldConfigureLogger) {
    return {
      level,
      formatters: {
        bindings: (bindings) => ({ hostname: bindings.hostname as string }),
        level: (label) => ({ level: label.toUpperCase() }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    };
  }
};

export const logger = pino(buildLoggerOptions());
