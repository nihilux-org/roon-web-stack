import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import * as path from "path";
import { fastifyStatic } from "@fastify/static";

const appRoute: FastifyPluginAsync = async (server: FastifyInstance): Promise<void> => {
  return server.register(fastifyStatic, {
    root: path.join(__dirname, "web"),
    immutable: true,
    maxAge: "1 days",
    wildcard: true,
    setHeaders: (res, requestedPath) => {
      if (requestedPath.endsWith("index.html")) {
        void res.setHeader("cache-control", "public, max-age=0");
      }
    },
  });
};

export default fastifyPlugin(appRoute);
