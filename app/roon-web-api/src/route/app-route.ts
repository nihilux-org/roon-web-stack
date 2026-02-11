import * as path from "path";

const webRoot = path.join(process.env.WEB_NG_PATH ?? __dirname, "web");

const shouldCompress = (acceptEncoding: string | null, contentType: string): boolean => {
  if (acceptEncoding === null) {
    return false;
  }
  const compressible =
    contentType.startsWith("text/") ||
    contentType.includes("javascript") ||
    contentType.includes("json") ||
    contentType.includes("xml") ||
    contentType.includes("svg");
  return compressible && acceptEncoding.includes("gzip");
};

const cacheHeaders = (filePath: string): Record<string, string> => {
  if (filePath.endsWith("index.html")) {
    return { "Cache-Control": "public, max-age=0" };
  }
  return { "Cache-Control": "public, max-age=86400, immutable" };
};

export const handleStaticRequest = async (req: Request, url: URL): Promise<Response> => {
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const resolved = path.resolve(webRoot, `.${pathname}`);
  if (!resolved.startsWith(webRoot)) {
    return new Response(null, { status: 403 });
  }
  const file = Bun.file(resolved);
  if (!(await file.exists())) {
    return new Response(null, { status: 404 });
  }
  const contentType = file.type;
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    ...cacheHeaders(resolved),
  };
  const acceptEncoding = req.headers.get("accept-encoding");
  if (shouldCompress(acceptEncoding, contentType)) {
    return new Response(file.stream().pipeThrough(new CompressionStream("gzip")), {
      headers: {
        ...headers,
        "Content-Encoding": "gzip",
        "Vary": "Accept-Encoding",
      },
    });
  } else {
    return new Response(file, { headers });
  }
};
