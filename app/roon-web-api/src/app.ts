import { fastify } from "fastify";
import * as process from "process";
import { clientManager, gracefulShutdownHook } from "@service";
import apiRoute from "./route/api-route";
import appRoute from "./route/app-route";

const init = async (): Promise<void> => {
  const logLevel = process.env["LOG_LEVEL"] ?? "info";
  const server = fastify({
    logger: logLevel === "trace" || logLevel === "debug",
  });
  const gracefulShutDown = gracefulShutdownHook(server);
  await server.register(apiRoute);
  await server.register(appRoute);
  const { HOST = "localhost", PORT = "3000" } = process.env;
  try {
    await server.listen({
      host: HOST,
      port: parseInt(PORT, 10),
    });
    gracefulShutDown.setReady();
    await clientManager.start();
  } catch (err: unknown) {
    server.log.error(err);
    await server.close();
    process.exit(1);
  }
};

void init();
