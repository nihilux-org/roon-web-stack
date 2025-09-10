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
} from "@nihilux/roon-web-model";
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
  server.post<{ Params: { previous_client_id?: string } }>("/register/:previous_client_id?", (req, reply) => {
    const previous_client_id = req.params.previous_client_id;
    const client_id = clientManager.register(previous_client_id);
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
      reply = reply.header("x-accel-buffering", "no");
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
  // Top-level genre album counts with cache (TTL default 1 day)
  server.get<{ Params: ClientIdParam }>("/:client_id/genre-counts", async (req, reply) => {
    const { client, badRequestReply } = getClient(req, reply);
    if (!client) return badRequestReply;
    try {
      const counts = await getGenreCountsCached();
      return reply.status(200).send(counts);
    } catch (err) {
      logger.error(err, "failed to compute genre counts");
      return reply.status(500).send();
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
      return await reply
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

// Simple in-memory cache for genre counts
type GenreAlbumCount = { title: string; count: number };
let _genreCountsCache: { at: number; data: GenreAlbumCount[] } | undefined;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const GENRE_COUNT_TTL_MS = Number(process.env.GENRE_COUNT_TTL_MS ?? ONE_DAY_MS);

async function getGenreCountsCached(): Promise<GenreAlbumCount[]> {
  const now = Date.now();
  if (_genreCountsCache && now - _genreCountsCache.at < GENRE_COUNT_TTL_MS) {
    return _genreCountsCache.data;
  }
  const data = await computeTopLevelGenreCounts();
  _genreCountsCache = { at: now, data };
  return data;
}

async function computeTopLevelGenreCounts(): Promise<GenreAlbumCount[]> {
  const server = await roon.server();
  const session = "genre-counts";
  // Compute counts via Genres subtitles and direct genre browse (no Focus)
  // Reset and browse top-level genres to avoid stale session state
  await server.services.RoonApiBrowse.browse({ hierarchy: "genres", pop_all: true, set_display_offset: true, multi_session_key: session });
  const root = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", multi_session_key: session });
  const level = root.list?.level;
  const total = root.list?.count ?? 0;
  // level can legitimately be 0; only bail if undefined
  if (level === undefined) return [];
  if (total <= 0) return [];
  // Collect all top-level genre items and any numeric counts present in subtitles
  const items: { title: string; item_key: string }[] = [];
  const subtitleCountByTitle = new Map<string, number>();
  const pageSize = 100;
  for (let offset = 0; offset < total; offset += pageSize) {
    const page = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level, offset, count: pageSize, multi_session_key: session });
    for (const it of page.items) {
      if (it.item_key && it.title) {
        items.push({ title: it.title, item_key: it.item_key });
        if (it.subtitle) {
          const c = parseAlbumsCount(it.subtitle);
          if (c !== undefined) subtitleCountByTitle.set(it.title.trim().toLowerCase(), c);
        }
      }
    }
  }
  // Limit concurrency to avoid hammering the core
  const concurrency = 6;
  const out: GenreAlbumCount[] = new Array(items.length);
  let idx = 0;
  const lc = (s?: string) => (s ? s.toLowerCase() : "");
  const avoid = [
    "composer",
    "composers",
    "composition",
    "compositions",
    "artist",
    "artists",
    "performer",
    "performers",
    "works",
    "work",
  ];
  const isAvoid = (t?: string) => !!t && avoid.some((w) => lc(t).includes(w));
  async function worker(): Promise<void> {
    while (true) {
      const my = idx++;
      if (my >= items.length) return;
      const it = items[my];
      const known = subtitleCountByTitle.get(lc(it.title));
      if (known !== undefined) {
        out[my] = { title: it.title, count: known };
        continue;
      }
      try {
        const gb = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: it.item_key, multi_session_key: session });
        const gl = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: gb.list?.level, multi_session_key: session });
        // Prefer an "In Library"/"Library" albums child if present
        const libTokens = [
          "in library",
          "library",
          "my library",
          "bibliothèque",
          "bibliotheque",
          "bibliotheek",
          "collection",
        ];
        const hasLibToken = (t?: string) => !!t && libTokens.some((w) => lc(t).includes(w));
        let libChild = gl.items.find((i) => i.item_key && hasLibToken(i.title));
        if (libChild?.item_key) {
          const lb = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: libChild.item_key, multi_session_key: session });
          const ll = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: lb.list?.level, multi_session_key: session });
          out[my] = { title: it.title, count: ll.list?.count ?? 0 };
          continue;
        }
        // Fast path: explicit Albums child (may include non-library on some cores)
        let albumsChild = gl.items.find((i) => lc(i.title) === "albums" && i.item_key) || gl.items.find((i) => lc(i.title)?.includes("albums") && i.item_key);
        if (albumsChild?.item_key) {
          const ab = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: albumsChild.item_key, multi_session_key: session });
          const al = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: ab.list?.level, multi_session_key: session });
          out[my] = { title: it.title, count: al.list?.count ?? 0 };
          continue;
        }

        // Fallback: breadth-first search up to depth 4 for a non-action list that likely contains albums/recordings
        type Node = { key: string; depth: number; title?: string };
        const queue: Node[] = [];
        const visited = new Set<string>();
        for (const child of gl.items) {
          if (child.item_key && !isAvoid(child.title)) queue.push({ key: child.item_key, depth: 1, title: child.title });
        }
        let foundCount = 0;
        while (queue.length > 0) {
          const { key, depth, title } = queue.shift()!;
          if (visited.has(key) || depth > 4) continue;
          visited.add(key);
          const b = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: key, multi_session_key: session });
          const l = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: b.list?.level, multi_session_key: session });
          if (l.list.hint !== "action_list") {
            // likely a list of albums/recordings; take its count
            foundCount = l.list?.count ?? 0;
            break;
          }
          // continue BFS; prioritize nodes that look like album lists
          const looksAlbum = (t?: string) => !!t && (hasLibToken(t) || lc(t).includes("album") || lc(t).includes("recording") || lc(t).includes("release"));
          const prioritized: typeof l.items = [] as any;
          const others: typeof l.items = [] as any;
          for (const ch of l.items) {
            if (!ch.item_key || isAvoid(ch.title)) continue;
            if (looksAlbum(ch.title)) prioritized.push(ch); else others.push(ch);
          }
          const next = [...prioritized, ...others];
          for (const n of next) {
            queue.push({ key: n.item_key!, depth: depth + 1, title: n.title });
          }
        }
        out[my] = { title: it.title, count: foundCount };
      } catch {
        out[my] = { title: it.title, count: 0 };
      }
    }
  }
  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) workers.push(worker());
  await Promise.all(workers);
  // Sort by count desc, then title asc
  out.sort((a, b) => (b.count - a.count) || a.title.localeCompare(b.title));
  return out;
}

// (Focus-based helpers removed as we use subtitles/genre browse for counts.)

// Extract number of Albums from a subtitle like "595 Artists, 356 Albums".
// Works with common singular/plural and falls back to the second number if two numbers are present.
function parseAlbumsCount(subtitle: string): number | undefined {
  try {
    const s = subtitle.toLowerCase();
    // Try to match "NN albums" or localized variants
    const albumTokens = ["album", "albums", "recording", "recordings", "release", "releases"];
    for (const tok of albumTokens) {
      const re = new RegExp(`(\\d{1,7})\\s+${tok}`);
      const m = s.match(re);
      if (m) return parseInt(m[1], 10);
    }
    // Fallback: if there are two numbers (e.g., "NN Artists, MM Albums"), use the second
    const nums = s.match(/\d{1,7}/g);
    if (nums && nums.length >= 2) return parseInt(nums[1], 10);
    if (nums && nums.length === 1) return parseInt(nums[0], 10);
    return undefined;
  } catch {
    return undefined;
  }
}
