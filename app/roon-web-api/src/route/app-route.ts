import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import * as path from "path";
import { fastifyCompress } from "@fastify/compress";
import { fastifyStatic } from "@fastify/static";

const appRoute: FastifyPluginAsync = async (server: FastifyInstance): Promise<void> => {
  await server.register(fastifyCompress);
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
