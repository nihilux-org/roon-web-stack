import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import * as path from "path";

const webRoot = path.join(process.env.WEB_NG_PATH ?? __dirname, "web");

export const appRouter = new Hono().use(
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
    rewriteRequestPath: (path) => {
      if (path === "/") {
        return "index.html";
      } else {
        return path;
      }
    },
  })
);
