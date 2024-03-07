import { FastifyInstance } from "fastify";
import GracefulServer from "@gquittet/graceful-server";
import IGracefulServer from "@gquittet/graceful-server/lib/types/interface/gracefulServer";
import { logger } from "@infrastructure";
import { clientManager } from "./client-manager";

const registerGracefulShutdown = (server: FastifyInstance): IGracefulServer => {
  const gracefulShutdown = GracefulServer(server.server, {
    timeout: 1000,
  });
  gracefulShutdown.on(GracefulServer.READY, () => {
    logger.debug("roon-web-api is ready");
  });
  gracefulShutdown.on(GracefulServer.SHUTTING_DOWN, () => {
    logger.debug("roon-web-api shutdown starts");
    clientManager.stop();
    logger.info("roon-web-api shutdown complete");
  });
  gracefulShutdown.on(GracefulServer.SHUTDOWN, (error) => {
    if (error instanceof Error && (error.message === "SIGINT" || error.message === "SIGTERM")) {
      logger.debug("server shutdown because of %s", error.message);
    } else {
      logger.error(error, "fatal error, server shutdown");
    }
  });
  return gracefulShutdown;
};

export const gracefulShutdownHook = registerGracefulShutdown;
