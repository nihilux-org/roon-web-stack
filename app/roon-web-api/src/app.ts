import { fastify } from "fastify";
import * as process from "process";
import { buildLoggerOptions, hostInfo } from "@infrastructure";
import { clientManager, gracefulShutdownHook } from "@service";
import apiRoute from "./route/api-route";
import appRoute from "./route/app-route";

const init = async (): Promise<void> => {
  const server = fastify({
    logger: buildLoggerOptions("debug"),
  });
  const gracefulShutDown = gracefulShutdownHook(server);
  await server.register(apiRoute);
  await server.register(appRoute);
  try {
    await server.listen({ host: hostInfo.host, port: hostInfo.port });
    gracefulShutDown.setReady();
    await clientManager.start();
  } catch (err: unknown) {
    server.log.error(err);
    await server.close();
    process.exit(1);
  }
};

void init();
