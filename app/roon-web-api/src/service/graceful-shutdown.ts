import { FastifyInstance } from "fastify";
import { fastifyGracefulShutdown } from "fastify-graceful-shutdown";
import { fastifyPlugin } from "fastify-plugin";
import { clientManager } from "./client-manager";

const gracefulShutdownHook = (server: FastifyInstance): void => {
  server.register(fastifyGracefulShutdown).after(() => {
    server.gracefulShutdown((signal) => {
      server.log.debug(`starting roon-web-api graceful shutdown (signal: ${signal})`);
      clientManager.stop();
      server.log.info("roon-web-api shutdown complete");
    });
  });
};

export const gracefulShutdown = fastifyPlugin((server: FastifyInstance) => {
  gracefulShutdownHook(server);
});
