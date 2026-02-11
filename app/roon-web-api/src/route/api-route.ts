import { extension_version, logger, roon } from "@infrastructure";
import {
  Client,
  Command,
  RoonApiBrowseLoadOptions,
  RoonApiBrowseOptions,
  RoonImageFormat,
  RoonImageScale,
} from "@nihilux/roon-web-model";
import { clientManager } from "@service";

const encoder = new TextEncoder();

const handleEvents = (client: Client, req: Request): Response => {
  const stream = new ReadableStream({
    start(controller) {
      const events = client.events();
      const sub = events.subscribe({
        next: (message) => {
          try {
            const { event, data } = message;
            const chunk = encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            controller.enqueue(chunk);
          } catch {
            // do nothing
          }
        },
        complete: () => {
          try {
            controller.close();
          } catch {
            // do nothing
          } finally {
            sub.unsubscribe();
          }
        },
      });
      req.signal.addEventListener("abort", () => {
        sub.unsubscribe();
        try {
          controller.close();
        } catch {
          // do nothing
        }
      });
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
      "x-accel-buffering": "no",
    },
  });
};

const jsonResponse = (body: unknown, status: number, headers?: Record<string, string>): Response => {
  return Response.json(body, { status, headers });
};

const emptyResponse = (status: number, headers?: Record<string, string>): Response => {
  return new Response(null, { status, headers });
};

const handleImage = async (url: URL): Promise<Response> => {
  const params = url.searchParams;
  const image_key = params.get("image_key");
  if (!image_key) {
    return emptyResponse(400);
  }
  let widthOption: number | undefined = undefined;
  let heightOption: number | undefined = undefined;
  let scaleOption: RoonImageScale | undefined = undefined;
  let formatOption: RoonImageFormat | undefined = undefined;
  const width = params.get("width");
  const height = params.get("height");
  const scale = params.get("scale");
  const format = params.get("format");
  if (width) {
    const parsedWidth = parseInt(width, 10);
    if (isNaN(parsedWidth)) {
      return emptyResponse(400);
    }
    widthOption = parsedWidth;
  }
  if (height) {
    const parsedHeight = parseInt(height, 10);
    if (isNaN(parsedHeight)) {
      return emptyResponse(400);
    }
    heightOption = parsedHeight;
  }
  if (scale === "fit" || scale === "fill" || scale === "stretch") {
    scaleOption = scale;
  }
  if (scaleOption && !(heightOption && widthOption)) {
    return emptyResponse(400);
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
    return new Response(image, {
      status: 200,
      headers: {
        "cache-control": "public, max-age=86400, immutable",
        "age": "0",
        "content-type": content_type,
      },
    });
  } catch (err) {
    if (err === "NotFound") {
      return emptyResponse(404, {
        "cache-control": "public, max-age=86400, immutable",
        "age": "0",
      });
    }
    logger.error(err, "image can't be fetched from roon");
    return emptyResponse(500);
  }
};

const API_PREFIX = "/api/";

export const isApiRequest = (url: URL): boolean => {
  return url.pathname.startsWith(API_PREFIX);
};

export const handleApiRequest = async (req: Request, url: URL): Promise<Response> => {
  const method = req.method;
  const segments = url.pathname
    .slice(API_PREFIX.length)
    .split("/")
    .filter((s) => s.length > 0);
  if (method === "POST" && segments[0] === "register") {
    const previousClientId = segments.length > 1 ? segments[1] : undefined;
    const client_id = clientManager.register(previousClientId);
    const location = `/api/${client_id}`;
    return emptyResponse(201, { location });
  } else if (method === "GET" && segments.length === 1) {
    if (segments[0] === "version") {
      return emptyResponse(204, { "x-roon-web-stack-version": extension_version });
    } else if (segments[0] === "image") {
      return handleImage(url);
    }
  } else if (segments.length === 2) {
    const clientId = segments[0];
    const action = segments[1];
    try {
      const client = clientManager.get(clientId);
      if (method === "GET" && action === "events") {
        return handleEvents(client, req);
      } else if (method === "POST" && action === "unregister") {
        clientManager.unregister(clientId);
        return emptyResponse(204);
      } else if (method === "POST") {
        const body = await req.json();
        if (action === "command") {
          const command_id = client.command(body as Command);
          return jsonResponse({ command_id }, 202);
        } else if (action === "browse") {
          const browseResponse = await client.browse(body as RoonApiBrowseOptions);
          return jsonResponse(browseResponse, 200);
        } else if (action === "load") {
          const loadResponse = await client.load(body as RoonApiBrowseLoadOptions);
          return jsonResponse(loadResponse, 200);
        }
      }
    } catch {
      return emptyResponse(403);
    }
  }
  return emptyResponse(404);
};
