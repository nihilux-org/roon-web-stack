import { Hono } from "hono";
import { compress } from "hono/compress";
import { logger } from "@infrastructure";
import { apiRouter } from "./api-router";
import { appRouter } from "./app-router";

export const roonWebApiRouter = new Hono()
  .use(
    compress({
      encoding: "gzip",
      threshold: 1024,
    })
  )

  .route("/api", apiRouter)
  .route("/", appRouter)

  .onError(
    /* istanbul ignore next */ (err, c) => {
      logger.error(err, "unexpected error");
      return c.json({ error: "Internal Server Error" }, 500);
    }
  )
  .notFound((c) => {
    return c.body(null, 404);
  });
