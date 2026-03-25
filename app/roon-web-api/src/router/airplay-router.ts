import { Hono } from "hono";
import { logger } from "@infrastructure";
import { AirplayMetadata } from "@nihilux/roon-web-model";
import { airplayService } from "@service";

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
      await airplayService.start(airplay_stream_url);
    } else {
      logger.error("POST /airplay: x-roon-airplay-stream-url is empty");
    }
    c.status(204);
    return c.body(null);
  })

  .delete("/", async (c) => {
    await airplayService.stop();
    c.status(204);
    return c.body(null);
  })

  .put("/metadata", async (c) => {
    const metadata: AirplayMetadata = await c.req.json();
    await airplayService.updateMetadata(metadata);
    c.status(204);
    return c.body(null);
  });
