import * as process from "process";
import { hostInfo, logger } from "@infrastructure";
import { clientManager, registerGracefulShutdown } from "@service";
import { handleApiRequest, isApiRequest } from "./route/api-route";
import { handleStaticRequest } from "./route/app-route";

const init = async (): Promise<void> => {
  try {
    await clientManager.start();
    const server = Bun.serve({
      port: hostInfo.port,
      hostname: hostInfo.host,
      idleTimeout: 0,
      async fetch(req) {
        const url = new URL(req.url);
        if (isApiRequest(url)) {
          return handleApiRequest(req, url);
        } else {
          return handleStaticRequest(req, url);
        }
      },
    });
    registerGracefulShutdown(server);
    logger.info(`roon-web-api listening on ${server.hostname}:${server.port}`);
  } catch (err: unknown) {
    logger.error(err);
    process.exit(1);
  }
};

void init();
