import { logger } from "@infrastructure";
import { clientManager } from "./client-manager";

export const registerGracefulShutdown = (server: { stop: () => void }): void => {
  const shutdown = (signal: string): void => {
    logger.debug(`starting roon-web-api graceful shutdown (signal: ${signal})`);
    clientManager.stop();
    logger.info("roon-web-api shutdown complete");
    server.stop();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};
