import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { streamSSE } from "hono/streaming";
import { extension_version, logger, roon } from "@infrastructure";
import {
  type Client,
  type Command,
  type RoonApiBrowseLoadOptions,
  type RoonApiBrowseOptions,
  type RoonImageFormat,
  type RoonImageScale,
} from "@nihilux/roon-web-model";
import { clientManager } from "@service";

interface Variables {
  client: Client;
}

const clientMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const clientId = c.req.param("clientId");
  try {
    const client = clientManager.get(clientId);
    c.set("client", client);
    await next();
  } catch {
    return c.body(null, 403);
  }
});

export const apiRouter = new Hono()
  .use(async (c, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    logger.debug(
      {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        duration: `${duration}ms`,
      },
      "request completed"
    );
  })

  .post("/register/:previousClientId?", (c) => {
    const previousClientId = c.req.param("previousClientId");
    const client_id = clientManager.register(previousClientId);
    return c.body(null, 201, {
      location: `/api/${client_id}`,
    });
  })

  .get("/version", (c) => {
    return c.body(null, 204, {
      "x-roon-web-stack-version": extension_version,
    });
  })

  .get("/image", async (c) => {
    const query = c.req.query();
    const image_key = query.image_key;

    if (!image_key) {
      return c.body(null, 400);
    }

    let widthOption: number | undefined = undefined;
    let heightOption: number | undefined = undefined;
    let scaleOption: RoonImageScale | undefined = undefined;
    let formatOption: RoonImageFormat | undefined = undefined;

    const width = query.width;
    const height = query.height;
    const scale = query.scale as "fit" | "fill" | "stretch" | undefined;
    const format = query.format as "jpeg" | "png" | undefined;

    if (width) {
      const parsedWidth = parseInt(width, 10);
      if (isNaN(parsedWidth)) {
        return c.body(null, 400);
      }
      widthOption = parsedWidth;
    }

    if (height) {
      const parsedHeight = parseInt(height, 10);
      if (isNaN(parsedHeight)) {
        return c.body(null, 400);
      }
      heightOption = parsedHeight;
    }

    if (scale === "fit" || scale === "fill" || scale === "stretch") {
      scaleOption = scale;
    }

    if (scaleOption && !(heightOption && widthOption)) {
      return c.body(null, 400);
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

      // @ts-expect-error typings
      return c.body(image, 200, {
        "cache-control": "public, max-age=86400, immutable",
        "age": "0",
        "content-type": content_type,
      });
    } catch (err) {
      if (err === "NotFound") {
        return c.body(null, 404, {
          "cache-control": "public, max-age=86400, immutable",
          "age": "0",
        });
      }
      logger.error(err, "image can't be fetched from roon");
      return c.body(null, 500);
    }
  })

  .get("/:clientId/events", clientMiddleware, (c) => {
    const client = c.get("client");
    const sseResponse = streamSSE(
      c,
      (stream) =>
        new Promise<void>((resolve) => {
          const events = client.events();
          const sub = events.subscribe({
            next: (message) => {
              const { event, data } = message;
              void stream.writeSSE({
                event,
                data: JSON.stringify(data),
              });
            },
            complete: () => {
              resolve();
            },
          });
          stream.onAbort(
            /* istanbul ignore next 4 lines */ () => {
              sub.unsubscribe();
              resolve();
            }
          );
        }),
      /* istanbul ignore next 5 lines */
      async (e, stream) => {
        logger.error(e, "SSE stream error");
        stream.abort();
        await stream.close();
      }
    );
    sseResponse.headers.set("x-accel-buffering", "no");
    return sseResponse;
  })

  .post("/:clientId/unregister", clientMiddleware, (c) => {
    const clientId = c.req.param("clientId");
    clientManager.unregister(clientId);
    return c.body(null, 204);
  })

  .post("/:clientId/command", clientMiddleware, async (c) => {
    const client = c.get("client");
    const body: Command = await c.req.json();
    const command_id = client.command(body);
    return c.json({ command_id }, 202);
  })

  .post("/:clientId/browse", clientMiddleware, async (c) => {
    const client = c.get("client");
    const body: RoonApiBrowseOptions = await c.req.json();
    const response = await client.browse(body);
    return c.json(response);
  })

  .post("/:clientId/load", clientMiddleware, async (c) => {
    const client = c.get("client");
    const body: RoonApiBrowseLoadOptions = await c.req.json();
    const response = await client.load(body);
    return c.json(response);
  });
