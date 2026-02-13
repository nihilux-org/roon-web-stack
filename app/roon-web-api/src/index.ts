import * as process from "process";
import { hostInfo, logger } from "@infrastructure";
import { roonWebApiRouter } from "@router";
import { clientManager } from "@service";

const shutdown = (signal: string, server: { stop: () => void }): void => {
  logger.debug(`starting roon-web-api graceful shutdown (signal: ${signal})`);
  clientManager.stop();
  logger.info("roon-web-api shutdown complete");
  server.stop();
  process.exit(0);
};

const init = async (): Promise<void> => {
  try {
    await clientManager.start();

    const server = Bun.serve({
      port: hostInfo.port,
      hostname: hostInfo.host,
      idleTimeout: 0,
      development: process.env.NODE_ENV === "development",
      fetch: roonWebApiRouter.fetch,
    });

    process.on("SIGTERM", () => shutdown("SIGTERM", server));
    process.on("SIGINT", () => shutdown("SIGINT", server));

    logger.info(`roon-web-api listening on ${server.hostname}:${server.port}`);
  } catch (err: unknown) {
    logger.error(err);
    process.exit(1);
  }
};

void init();
