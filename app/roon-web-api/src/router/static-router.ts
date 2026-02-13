import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import * as path from "path";

const webRoot = path.join(process.env.WEB_NG_PATH ?? __dirname, "web");

const createStaticRouter = () => {
  return new Hono()
    .get(
      "/",
      serveStatic({
        path: path.join(webRoot, "index.html"),
        onFound: (_, c) => {
          c.header("Cache-Control", "public, max-age=0");
        },
      })
    )
    .use(
      "/*",
      serveStatic({
        root: webRoot,
        onFound: (filePath, c) => {
          if (filePath.endsWith("index.html")) {
            c.header("Cache-Control", "public, max-age=0");
          } else {
            c.header("Cache-Control", "public, max-age=86400, immutable");
          }
        },
      })
    );
};

export const staticRouter = createStaticRouter();
