import { Hono } from "hono";
import { compress } from "hono/compress";
import { logger } from "@infrastructure";
import { apiRouter } from "./api-router";
import { staticRouter } from "./static-router";

const createRoonWebApiRouter = () => {
  return new Hono()
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
    .use(
      compress({
        encoding: "gzip",
        threshold: 1024,
      })
    )

    .route("/api", apiRouter)
    .route("/", staticRouter)

    .onError((err, c) => {
      logger.error(err, "unexpected error");
      return c.json({ error: "Internal Server Error" }, 500);
    })
    .notFound((c) => {
      return c.body(null, 404);
    });
};

export const roonWebApiRouter = createRoonWebApiRouter();
