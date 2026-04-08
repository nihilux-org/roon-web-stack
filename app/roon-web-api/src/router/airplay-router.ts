import { Hono } from "hono";
import { airplayManager } from "@data";
import { logger } from "@infrastructure";
import { AirplayMetadata } from "@nihilux/roon-web-model";

export const airplayRouter = new Hono()
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

  .post("/", async (c) => {
    const airplay_stream_url = c.req.header("x-roon-airplay-stream-url");
    if (airplay_stream_url !== undefined) {
      await airplayManager.start(airplay_stream_url);
    } else {
      logger.error("POST /airplay: x-roon-airplay-stream-url is empty");
    }
    c.status(204);
    return c.body(null);
  })

  .delete("/", async (c) => {
    await airplayManager.stop();
    c.status(204);
    return c.body(null);
  })

  .put("/metadata", async (c) => {
    const metadata: AirplayMetadata = await c.req.json();
    await airplayManager.updateMetadata(metadata);
    c.status(204);
    return c.body(null);
  })

  .put("/image", async (c) => {
    const body = await c.req.arrayBuffer();
    if (body.byteLength === 0) {
      return c.body(null, 400);
    }
    const contentType = c.req.header("Content-Type") ?? "image/jpeg";
    airplayManager.image = {
      data: new Uint8Array(body),
      contentType,
    };
    c.status(204);
    return c.body(null);
  });
