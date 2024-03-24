import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { FastifySSEPlugin } from "fastify-sse-v2";
import { extension_version, logger, roon } from "@infrastructure";
import {
  Client,
  ClientRoonApiBrowseLoadOptions,
  ClientRoonApiBrowseOptions,
  Command,
  RoonImageFormat,
  RoonImageScale,
} from "@model";
import { clientManager } from "@service";

interface ClientIdParam {
  client_id: string;
}

interface ImageQuery {
  height: string;
  width: string;
  scale: string;
  format: string;
  image_key: string;
}

const apiRoute: FastifyPluginAsync = async (server: FastifyInstance): Promise<void> => {
  await server.register(FastifySSEPlugin);
  server.get("/version", (_: FastifyRequest, reply: FastifyReply) => {
    return reply.status(204).header("x-roon-web-stack-version", extension_version).send();
  });
  server.post("/register", (_: FastifyRequest, reply: FastifyReply) => {
    const client_id = clientManager.register();
    const location = `/api/${client_id}`;
    return reply.status(201).header("location", location).send();
  });
  server.post<{ Params: ClientIdParam }>("/:client_id/unregister", (req, reply) => {
    const client_id = req.params.client_id;
    clientManager.unregister(client_id);
    return reply.status(204).send();
  });
  server.post<{ Params: ClientIdParam; Body: Command }>("/:client_id/command", async (req, reply) => {
    const { client, badRequestReply } = getClient(req, reply);
    if (client) {
      const command_id = client.command(req.body);
      return reply.status(202).send({
        command_id,
      });
    } else {
      return badRequestReply;
    }
  });
  server.post<{ Params: ClientIdParam; Body: ClientRoonApiBrowseOptions }>("/:client_id/browse", async (req, reply) => {
    const { client, badRequestReply } = getClient(req, reply);
    if (client) {
      const browseResponse = await client.browse(req.body);
      return reply.status(200).send(browseResponse);
    } else {
      return badRequestReply;
    }
  });
  server.post<{ Params: ClientIdParam; Body: ClientRoonApiBrowseLoadOptions }>(
    "/:client_id/load",
    async (req, reply) => {
      const { client, badRequestReply } = getClient(req, reply);
      if (client) {
        const loadResponse = await client.load(req.body);
        return reply.status(200).send(loadResponse);
      } else {
        return badRequestReply;
      }
    }
  );
  server.get<{ Params: ClientIdParam }>("/:client_id/events", (req, reply) => {
    const { client, badRequestReply } = getClient(req, reply);
    if (client) {
      const events = client.events();
      const sub = events.subscribe({
        next: (message) => {
          reply.sse({
            event: message.event,
            data: JSON.stringify(message.data),
          });
        },
        complete: () => {
          reply.sseContext.source.end();
          sub.unsubscribe();
        },
      });
      req.socket.on("close", () => {
        sub.unsubscribe();
        client.close();
      });
    } else {
      return badRequestReply;
    }
  });
  server.get<{ Querystring: ImageQuery }>("/image", async (req, reply) => {
    const { image_key, width, height, scale, format } = req.query;
    if (!image_key) {
      return reply.status(400).send();
    }
    let widthOption: number | undefined = undefined;
    let heightOption: number | undefined = undefined;
    let scaleOption: RoonImageScale | undefined = undefined;
    let formatOption: RoonImageFormat | undefined = undefined;
    if (width) {
      const parsedWidth = parseInt(width, 10);
      if (isNaN(parsedWidth)) {
        return reply.status(400).send();
      } else {
        widthOption = parsedWidth;
      }
    }
    if (height) {
      const parsedHeight = parseInt(height, 10);
      if (isNaN(parsedHeight)) {
        return reply.status(400).send();
      } else {
        heightOption = parsedHeight;
      }
    }
    if (scale === "fit" || scale === "fill" || scale === "stretch") {
      scaleOption = scale;
    }
    if (scaleOption && !(heightOption && widthOption)) {
      return reply.status(400).send();
    }
    if (format === "jpeg") {
      formatOption = "image/jpeg";
    } else if (format === "png") {
      formatOption = "image/png";
    }
    try {
      const { content_type, image } = await roon.getImage(image_key, {
        format: formatOption,
        height: heightOption,
        scale: scaleOption,
        width: widthOption,
      });
      return reply
        .status(200)
        .header("cache-control", "public, max-age=86400, immutable")
        .header("age", "0")
        .header("content-type", content_type)
        .send(image);
    } catch (err) {
      if (err === "NotFound") {
        return reply.status(404).header("cache-control", "public, max-age=86400, immutable").header("age", "0").send();
      } else {
        logger.error(err, "image can't be fetched from roon");
        return reply.status(500).send();
      }
    }
  });
};

const getClient = (
  req: FastifyRequest<{ Params: ClientIdParam }>,
  res: FastifyReply
): {
  client?: Client;
  badRequestReply?: FastifyReply;
} => {
  try {
    const client_id = req.params.client_id;
    return {
      client: clientManager.get(client_id),
    };
  } catch (err) {
    if (err instanceof Error) {
      logger.warn(err.message);
    }
    return {
      badRequestReply: res.status(403).send(),
    };
  }
};

export default fastifyPlugin(async (app) => {
  return app.register(apiRoute, {
    prefix: "/api",
  });
});
