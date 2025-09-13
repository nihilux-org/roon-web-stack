import { CommandExecutor, FoundZone, Item, PlayRandomAlbumCommand, RoonApiBrowseLoadResponse } from "@nihilux/roon-web-model";
import { logger } from "@infrastructure";

type SourcedItem = { item: Item; hierarchy: "albums" | "genres" };

export const executor: CommandExecutor<PlayRandomAlbumCommand, FoundZone> = async (command, foundZone) => {
  const { server, zone } = foundZone;
  const hierarchy = "albums" as const;

  // Reset browse state for a clean navigation
  await server.services.RoonApiBrowse.browse({ hierarchy, pop_all: true, set_display_offset: true });

  const { included_genres, excluded_genres } = command.data;
  let albumItem: SourcedItem | undefined;
  const excludedKeys = await collectExcludedItemKeys(server, zone.zone_id, excluded_genres ?? []);

  // Try honoring filters first (assume top-level genres; no deep traversal)
  if (included_genres && included_genres.length > 0) {
    // Unique-union: deduplicate across included genres before picking
    albumItem = await pickRandomAlbumFromUniqueUnion(server, zone.zone_id, included_genres, excludedKeys);
    if (!albumItem) {
      // Fallback (generic, no Focus): try per-genre traversal under Genres hierarchy
      const shuffled = shuffleArray(included_genres.slice());
      for (const g of shuffled) {
        const viaGenre = await pickRandomAlbumFromGenreExcluding(server, zone.zone_id, g, excludedKeys);
        if (viaGenre) { albumItem = viaGenre; break; }
      }
      // Last resort: try Albums -> Focus path per-genre (may not be available on all cores)
      if (!albumItem) {
        for (const g of shuffled) {
          const viaFocus = await pickRandomAlbumUsingFocus(server, zone.zone_id!, g);
          if (viaFocus) { albumItem = viaFocus; break; }
        }
      }
    }
    if (!albumItem) {
      throw new Error("No albums found for the selected genres");
    }
  }

  if (!albumItem) {
    // Fallback to global albums selection
    const browseRoot = await server.services.RoonApiBrowse.browse({ hierarchy: "albums" });
    const count = browseRoot.list?.count ?? 0;
    if (!count || count <= 0) {
      throw new Error("No albums found to select from");
    }
    // rejection sampling to avoid excluded items
    for (let attempt = 0; attempt < 60; attempt++) {
      const randomIndex = Math.floor(Math.random() * count);
      const loadRandom = await server.services.RoonApiBrowse.load({ hierarchy: "albums", offset: randomIndex, count: 1 });
      const item = loadRandom.items?.[0];
      if (item && (!item.item_key || !excludedKeys.has(item.item_key))) {
        albumItem = { item, hierarchy: "albums" };
        break;
      }
    }
  }

  if (!albumItem || !albumItem.item.item_key) {
    throw new Error("Random album item not found or has no item_key");
  }

  // Enter the album
  logger.debug("random: selected album item '%s'", albumItem.item.title ?? albumItem.item.item_key);
  let actionsLoad: RoonApiBrowseLoadResponse;
  try {
    const albumBrowseResponse = await server.services.RoonApiBrowse.browse({
      hierarchy: albumItem.hierarchy,
      item_key: albumItem.item.item_key!,
      zone_or_output_id: zone.zone_id,
    });
    actionsLoad = await server.services.RoonApiBrowse.load({ hierarchy: albumItem.hierarchy, level: albumBrowseResponse.list?.level });
  } catch (e) {
    // Fallback: refresh path Genres -> <genre> -> Albums and locate by title
    logger.debug("random: album item_key invalid, retrying via title match");
    const refreshed = await reselectAlbumByTitle(server, zone.zone_id, albumItem);
    const albumBrowseResponse = await server.services.RoonApiBrowse.browse({
      hierarchy: albumItem.hierarchy,
      item_key: refreshed.item_key!,
      zone_or_output_id: zone.zone_id,
    });
    actionsLoad = await server.services.RoonApiBrowse.load({ hierarchy: albumItem.hierarchy, level: albumBrowseResponse.list?.level });
  }

  // If actions are nested, navigate to reach the action_list
  if (actionsLoad.list.hint !== "action_list") {
    const maybeNested = actionsLoad.items.find((i) => i.hint === "action_list" && i.item_key);
    if (maybeNested?.item_key) {
      const nested = await server.services.RoonApiBrowse.browse({ hierarchy: albumItem.hierarchy, item_key: maybeNested.item_key });
      actionsLoad = await server.services.RoonApiBrowse.load({ hierarchy: albumItem.hierarchy, level: nested.list?.level });
    }
  }

  // Choose a suitable action (avoid starting radio)
  const toLower = (s?: string) => (s ? s.toLowerCase() : "");
  const actions = actionsLoad.items.filter((i) => !toLower(i.title).includes("radio"));
  const preferred =
    actions.find((i) => toLower(i.title) === "play now") ||
    actions.find((i) => ["queue", "add to queue", "add to playing now"].includes(toLower(i.title) ?? "")) ||
    actions.find((i) => toLower(i.title) === "shuffle") ||
    actions.find((i) => i.hint === "action");

  if (!preferred?.item_key) {
    throw new Error("No playable action found for the selected album");
  }

  // Make sure auto_radio is disabled so Roon Radio doesn't hijack playback
  try {
    await server.services.RoonApiTransport.change_settings(zone, { auto_radio: false });
  } catch {}
  // Trigger the action on the target zone
  logger.debug("random: triggering action '%s'", preferred.title ?? preferred.item_key);
  await server.services.RoonApiBrowse.browse({ hierarchy: albumItem.hierarchy, item_key: preferred.item_key, zone_or_output_id: zone.zone_id });
};

/**
 * Pick a random album from the union of Albums under the selected top-level genres.
 * Assumptions per UI: genres provided are top-level; do not traverse nested trees.
 */
async function pickRandomAlbumFromGenresUnion(
  server: FoundZone["server"],
  zone_id: string | undefined,
  genreTitles: string[],
  excludedKeys: Set<string>
): Promise<SourcedItem | undefined> {
  const toKey = (s: string) => s.trim().toLowerCase();

  // Build a map of top-level genre title -> item_key
  const genresRoot = await server.services.RoonApiBrowse.browse({ hierarchy: "genres" });
  const level = genresRoot.list?.level;
  const total = genresRoot.list?.count ?? 0;
  if (!level || !total || total <= 0) return undefined;

  const titleToKey = new Map<string, string>();
  const pageSize = 100;
  for (let offset = 0; offset < total; offset += pageSize) {
    const page = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level, offset, count: pageSize });
    for (const it of page.items) {
      if (it.item_key && it.title) titleToKey.set(toKey(it.title), it.item_key);
    }
  }

  type AlbumListRef = { title: string; albumsLevel: number; count: number; entryKey: string };
  const lists: AlbumListRef[] = [];

  // For each selected genre, find a list of albums (direct "Albums" or fallback via BFS) and capture its list level/count
  for (const g of genreTitles) {
    const key = titleToKey.get(toKey(g));
    if (!key) continue;
    const gb = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: key, zone_or_output_id: zone_id });
    const gl = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: gb.list?.level });
    const lc = (s?: string) => (s ? s.toLowerCase() : "");
    let albumsChild = gl.items.find((it) => lc(it.title) === "albums" && it.item_key);
    if (!albumsChild) albumsChild = gl.items.find((it) => lc(it.title).includes("albums") && it.item_key);
    if (albumsChild?.item_key) {
      const ab = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: albumsChild.item_key, zone_or_output_id: zone_id });
      const al = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: ab.list?.level });
      const count = al.list?.count ?? 0;
      if (al.list?.level !== undefined && count > 0) {
        lists.push({ title: g, albumsLevel: al.list.level!, count, entryKey: albumsChild.item_key });
      }
      continue;
    }

    // Fallback: BFS to find a non-action list that likely contains albums
    type Node = { key: string; depth: number; title?: string };
    const queue: Node[] = [];
    const visited = new Set<string>();
    for (const child of gl.items) {
      if (child.item_key) queue.push({ key: child.item_key, depth: 1, title: child.title });
    }
    const looksAlbum = (t?: string) => !!t && (lc(t).includes("album") || lc(t).includes("recording") || lc(t).includes("release") || lc(t).includes("library"));
    while (queue.length > 0) {
      const { key: nodeKey, depth } = queue.shift()!;
      if (visited.has(nodeKey) || depth > 6) continue;
      visited.add(nodeKey);
      const b = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: nodeKey, zone_or_output_id: zone_id });
      const l = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: b.list?.level });
      if (l.list.hint !== "action_list") {
        const c = l.list?.count ?? 0;
        if (l.list?.level !== undefined && c > 0) {
          lists.push({ title: g, albumsLevel: l.list.level!, count: c, entryKey: nodeKey });
          break;
        }
      }
      // expand
      const prioritized: typeof l.items = [] as any;
      const others: typeof l.items = [] as any;
      for (const it of l.items) {
        if (!it.item_key) continue;
        if (looksAlbum(it.title)) prioritized.push(it); else others.push(it);
      }
      for (const it of [...prioritized, ...others]) queue.push({ key: it.item_key!, depth: depth + 1, title: it.title });
    }
  }

  const grandTotal = lists.reduce((acc, l) => acc + l.count, 0);
  if (grandTotal <= 0) {
    logger.debug("random: union path found no album lists for genres=%s", JSON.stringify(genreTitles));
    return undefined;
  }

  // Weighted random choice across union of albums in all selected genres
  let r = Math.floor(Math.random() * grandTotal);
  for (const l of lists) {
    if (r < l.count) {
      const pageOffset = Math.floor(r / 100) * 100;
      // Ensure we are at the correct list by browsing to its entryKey before loading
      const nb = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: l.entryKey, zone_or_output_id: zone_id });
      const base = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: nb.list?.level });
      const page = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: base.list.level, offset: pageOffset, count: 100 });
      const item = page.items[r - pageOffset];
      if (item && (!item.item_key || !excludedKeys.has(item.item_key))) return { item, hierarchy: "genres" };
      // rejection: pick again within same list
      for (let tries = 0; tries < 30; tries++) {
        const idx = Math.floor(Math.random() * l.count);
        const po = Math.floor(idx / 100) * 100;
        const pg = po === pageOffset ? page : await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: base.list.level, offset: po, count: 100 });
        const cand = pg.items[idx - po];
        if (cand && (!cand.item_key || !excludedKeys.has(cand.item_key))) return { item: cand, hierarchy: "genres" };
      }
      return undefined;
    }
    r -= l.count;
  }
  return undefined;
}

async function selectGenre(
  server: FoundZone["server"],
  included?: string[],
  excluded?: string[]
): Promise<string | undefined> {
  const toKey = (s: string) => s.trim().toLowerCase();
  const excludedSet = new Set((excluded ?? []).map(toKey));
  if (included && included.length > 0) {
    // pick one include at random
    const idx = Math.floor(Math.random() * included.length);
    return included[idx];
  }
  // choose a random non-excluded genre
  const genresRoot = await server.services.RoonApiBrowse.browse({ hierarchy: "genres" });
  const count = genresRoot.list?.count ?? 0;
  if (!count || count <= 0) return undefined;
  for (let attempt = 0; attempt < 40; attempt++) {
    const randomIndex = Math.floor(Math.random() * count);
    const pageOffset = Math.floor(randomIndex / 100) * 100;
    const page: RoonApiBrowseLoadResponse = await server.services.RoonApiBrowse.load({
      hierarchy: "genres",
      offset: pageOffset,
      count: 100,
      level: genresRoot.list?.level,
    });
    const item = page.items[randomIndex - pageOffset];
    const titleKey = toKey(item?.title ?? "");
    if (item && item.title && !excludedSet.has(titleKey)) {
      return item.title;
    }
  }
  return undefined;
}

async function findGenreItemKey(
  server: FoundZone["server"],
  genreTitle: string
): Promise<string | undefined> {
  const wanted = genreTitle.trim().toLowerCase();
  // Reset genres browse state to avoid stale sessions
  await server.services.RoonApiBrowse.browse({ hierarchy: "genres", pop_all: true, set_display_offset: true });
  const genresRoot = await server.services.RoonApiBrowse.browse({ hierarchy: "genres" });
  const count = genresRoot.list?.count ?? 0;
  const level = genresRoot.list?.level;
  const pageSize = 100;
  let partial: string | undefined;
  logger.debug("random: searching genre key for '%s' in %s entries", genreTitle, String(count));
  for (let offset = 0; offset < count; offset += pageSize) {
    const page = await server.services.RoonApiBrowse.load({ hierarchy: "genres", offset, count: pageSize, level });
    const found = page.items.find((it) => (it.title ?? "").trim().toLowerCase() === wanted);
    if (found?.item_key) return found.item_key;
    // fallback: contains/startsWith match to handle sub-genres/localization variations
    if (!partial) {
      const contains = page.items.find((it) => (it.title ?? "").trim().toLowerCase().includes(wanted));
      if (contains?.item_key) partial = contains.item_key;
    }
  }
  if (partial) {
    logger.debug("random: using partial match for genre '%s'", genreTitle);
    return partial;
  }

  // Generic grouped-genres fallback: shallow BFS under each top-level genre container
  try {
    const root = await server.services.RoonApiBrowse.browse({ hierarchy: "genres" });
    const first = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: root.list?.level, offset: 0, count: 200 });
    for (const top of first.items) {
      if (!top.item_key) continue;
      const b = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: top.item_key });
      const l = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: b.list?.level });
      const child = l.items.find((it) => (it.title ?? "").trim().toLowerCase().includes(wanted));
      if (child?.item_key) {
        logger.debug("random: found '%s' under '%s' via BFS", genreTitle, top.title ?? top.item_key);
        return child.item_key;
      }
    }
  } catch {}

  logger.debug("random: genre '%s' not found in Genres list", genreTitle);
  return undefined;
}

async function pickRandomAlbumFromGenre(
  server: FoundZone["server"],
  zone_id: string | undefined,
  genreTitle: string
): Promise<SourcedItem | undefined> {
  const item_key = await findGenreItemKey(server, genreTitle);
  if (!item_key) return undefined;
  // open the genre
  const genreBrowse = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key, zone_or_output_id: zone_id });
  const firstLoad = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: genreBrowse.list?.level });

  // Fast-path: if there is an explicit "Albums" entry under the genre, use it directly
  const lc = (s?: string) => (s ? s.toLowerCase() : "");
  let albumsChild = firstLoad.items.find((it) => lc(it.title) === "albums" && it.item_key);
  if (!albumsChild) {
    albumsChild = firstLoad.items.find((it) => lc(it.title).includes("albums") && it.item_key);
  }
  if (!albumsChild) {
    // Fallback: pick a likely albums list (hint=list, not artists)
    const candidates = firstLoad.items.filter(
      (it) => it.item_key && it.hint !== "action_list" && !lc(it.title).includes("artist")
    );
    if (candidates.length > 0) {
      albumsChild = candidates[0];
      logger.debug("random: genre '%s' -> fallback child '%s'", genreTitle, albumsChild.title ?? albumsChild.item_key);
    }
  }
  if (albumsChild?.item_key) {
    const b = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: albumsChild.item_key, zone_or_output_id: zone_id });
    const l = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: b.list?.level });
    logger.debug("random: genre '%s' -> Albums list.hint=%s, count=%s", genreTitle, String(l.list?.hint ?? 'undefined'), String(l.list?.count ?? '?'));
    const directItems = l.items ?? [];
    if (directItems.length > 0) {
      const idx = Math.floor(Math.random() * directItems.length);
      logger.debug(
        "random: genre '%s' -> Albums count: %s, picked index: %s, title: %s",
        genreTitle,
        String(l.list?.count ?? directItems.length),
        String(idx),
        directItems[idx]?.title ?? "?"
      );
      return { item: directItems[idx], hierarchy: "genres" };
    }
    const item = await pickRandomFromLoadedList(server, l);
    if (item) return { item, hierarchy: "genres" };
  }

  // Breadth-first search up to depth 4 to find a list of albums/items
  type Node = { key: string; depth: number; title?: string };
  const queue: Node[] = [];
  const visited = new Set<string>();
  const lower = (s?: string) => (s ? s.toLowerCase() : "");
  const g = lower(genreTitle);

  const avoid = ["composer", "composers", "composition", "compositions", "artist", "artists", "performer", "performers", "works", "work"];
  const isAvoid = (t?: string) => !!t && avoid.some((w) => lower(t).includes(w));

  // Seed queue with candidates from first level
  for (const it of firstLoad.items) {
    if (it.item_key && !isAvoid(it.title)) {
      queue.push({ key: it.item_key, depth: 1, title: it.title });
    }
  }

  while (queue.length > 0) {
    const { key, depth, title } = queue.shift()!;
    if (visited.has(key) || depth > 4) continue;
    visited.add(key);
    logger.debug("random: genre '%s' exploring '%s' (d=%d)", genreTitle, title ?? key, depth);
    const b = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: key });
    const l = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: b.list?.level });
    if (l.list.hint !== "action_list") {
      const item = await pickRandomFromLoadedList(server, l);
      return item ? { item, hierarchy: "genres" } : undefined;
    }
    // Prioritize items with album/recording/release tokens and/or genre name
    const prioritized: Item[] = [];
    const others: Item[] = [];
    for (const it of l.items) {
      if (!it.item_key || isAvoid(it.title)) continue;
      const t = lower(it.title);
      const looksAlbum = t.includes("album") || t.includes("recording") || t.includes("release");
      const mentionGenre = t.includes(g);
      if (looksAlbum && mentionGenre) prioritized.push(it);
      else if (looksAlbum) prioritized.push(it);
      else others.push(it);
    }
    const next = [...prioritized, ...others];
    for (const it of next) {
      queue.push({ key: it.item_key!, depth: depth + 1, title: it.title });
    }
  }
  logger.debug("random: genre '%s' no album list found after BFS", genreTitle);
  return undefined;
}

async function pickRandomAlbumFromGenreExcluding(
  server: FoundZone["server"],
  zone_id: string | undefined,
  genreTitle: string,
  excludedKeys: Set<string>
): Promise<SourcedItem | undefined> {
  const res = await pickRandomAlbumFromGenre(server, zone_id, genreTitle);
  if (!res) return undefined;
  if (!res.item.item_key || !excludedKeys.has(res.item.item_key)) return res;
  // rejection: attempt a few more picks from the same genre
  const item_key = await findGenreItemKey(server, genreTitle);
  if (!item_key) return undefined;
  const b = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key, zone_or_output_id: zone_id });
  const l = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: b.list?.level });
  for (let tries = 0; tries < 40; tries++) {
    const item = await pickRandomFromLoadedList(server, l);
    if (item && (!item.item_key || !excludedKeys.has(item.item_key))) return { item, hierarchy: "genres" };
  }
  return undefined;
}

async function collectExcludedItemKeys(
  server: FoundZone["server"],
  zone_id: string | undefined,
  excludedGenres: string[]
): Promise<Set<string>> {
  const set = new Set<string>();
  if (!excludedGenres || excludedGenres.length === 0) return set;
  for (const g of excludedGenres) {
    const item_key = await findGenreItemKey(server, g);
    if (!item_key) continue;
    const gb = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key, zone_or_output_id: zone_id });
    const gl = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: gb.list?.level });
    // Prefer Albums list if present
    const lc = (s?: string) => (s ? s.toLowerCase() : "");
    let albumsChild = gl.items.find((it) => lc(it.title) === "albums" && it.item_key) || gl.items.find((it) => lc(it.title)?.includes("albums") && it.item_key);
    let targetLevel: number | undefined;
    if (albumsChild?.item_key) {
      const ab = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: albumsChild.item_key, zone_or_output_id: zone_id });
      const al = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: ab.list?.level });
      targetLevel = al.list?.level;
    } else {
      targetLevel = gl.list?.level;
    }
    if (targetLevel === undefined) continue;
    // iterate pages
    let offset = 0;
    const pageSize = 100;
    // try to get count
    let page = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: targetLevel, offset, count: pageSize });
    const total = page.list?.count ?? page.items.length;
    const addItems = (items: Item[]) => items.forEach((it) => it.item_key && set.add(it.item_key));
    addItems(page.items ?? []);
    for (offset = pageSize; offset < total; offset += pageSize) {
      page = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: targetLevel, offset, count: pageSize });
      addItems(page.items ?? []);
      if (set.size > 5000) break;
    }
    if (set.size > 5000) break;
  }
  return set;
}

async function pickRandomFromLoadedList(
  server: FoundZone["server"],
  load: RoonApiBrowseLoadResponse
): Promise<Item | undefined> {
  const total = load.list.count;
  if (!total || total <= 0) return undefined;
  const randomIndex = Math.floor(Math.random() * total);

  // If the current load already contains the item at randomIndex, return directly
  const currentOffset = (load as any).offset ?? 0;
  const items = load.items ?? [];
  if (randomIndex >= currentOffset && randomIndex < currentOffset + items.length) {
    return items[randomIndex - currentOffset];
  }

  // Otherwise, load the page that contains the random index
  const pageOffset = Math.floor(randomIndex / 100) * 100;
  const loadOptions: any = {
    hierarchy: "genres",
    offset: pageOffset,
    count: 100,
  };
  if (load.list.level !== undefined) {
    loadOptions.level = load.list.level;
  }
  const page = await server.services.RoonApiBrowse.load(loadOptions);
  return page.items[randomIndex - pageOffset];
}

async function pickRandomFromLoadedListGeneric(
  server: FoundZone["server"],
  hierarchy: "genres" | "albums",
  load: RoonApiBrowseLoadResponse
): Promise<Item | undefined> {
  const total = load.list.count;
  if (!total || total <= 0) return undefined;
  const randomIndex = Math.floor(Math.random() * total);
  const pageOffset = Math.floor(randomIndex / 100) * 100;
  const page = await server.services.RoonApiBrowse.load({
    hierarchy,
    level: load.list.level,
    offset: pageOffset,
    count: 100,
  });
  return page.items[randomIndex - pageOffset];
}

async function pickRandomAlbumFromUniqueUnion(
  server: FoundZone["server"],
  zone_id: string | undefined,
  includes: string[],
  excludedKeys: Set<string>
): Promise<SourcedItem | undefined> {
  // Build a de-duplicated set of album item_keys across included genres, then pick uniformly
  const toKey = (s: string) => s.trim().toLowerCase();
  // Resolve top-level map of genre titles -> item_key
  const genresRoot = await server.services.RoonApiBrowse.browse({ hierarchy: "genres" });
  const level = genresRoot.list?.level;
  const total = genresRoot.list?.count ?? 0;
  if (level === undefined || total <= 0) return undefined;
  const titleToKey = new Map<string, string>();
  const pageSize = 100;
  for (let offset = 0; offset < total; offset += pageSize) {
    const page = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level, offset, count: pageSize });
    for (const it of page.items) if (it.item_key && it.title) titleToKey.set(toKey(it.title), it.item_key);
  }

  const libTokens = ["in library", "library", "my library", "bibliothèque", "bibliotheque", "bibliotheek", "collection"];
  const lc = (s?: string) => (s ? s.toLowerCase() : "");
  const hasLibToken = (t?: string) => !!t && libTokens.some((w) => lc(t).includes(w));

  const keys = new Set<string>();
  for (const g of includes) {
    const gk = titleToKey.get(toKey(g));
    if (!gk) continue;
    const gb = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: gk, zone_or_output_id: zone_id });
    const gl = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: gb.list?.level });
    let target = gl.items.find((i) => i.item_key && hasLibToken(i.title));
    if (!target) target = gl.items.find((i) => i.item_key && (lc(i.title) === "albums" || lc(i.title)?.includes("albums")));
    // Determine a level to load from; if no explicit child, use current level
    let targetLevel = gl.list?.level;
    if (target?.item_key) {
      const tb = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: target.item_key, zone_or_output_id: zone_id });
      const tl = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: tb.list?.level });
      targetLevel = tl.list?.level;
    }
    if (targetLevel === undefined) continue;
    // Iterate pages to collect album keys
    let offset = 0;
    const first = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: targetLevel, offset, count: pageSize });
    const totalItems = first.list?.count ?? first.items.length;
    const add = (items: Item[]) => items.forEach((it) => { if (it.item_key && !excludedKeys.has(it.item_key)) keys.add(it.item_key); });
    add(first.items ?? []);
    for (offset = pageSize; offset < totalItems; offset += pageSize) {
      const page = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: targetLevel, offset, count: pageSize });
      add(page.items ?? []);
      if (keys.size > 20000) break;
    }
    if (keys.size > 20000) break;
  }
  if (keys.size === 0) return undefined;
  // Uniform pick from the set
  const idx = Math.floor(Math.random() * keys.size);
  const arr = Array.from(keys);
  const pickedKey = arr[idx];
  return { item: { item_key: pickedKey } as Item, hierarchy: "genres" };
}

async function pickRandomAlbumViaSearch(
  server: FoundZone["server"],
  zone_id: string,
  query: string
): Promise<SourcedItem | undefined> {
  logger.debug("random: using Search fallback for '%s'", query);
  const lower = (s?: string) => (s ? s.toLowerCase() : "");
  await server.services.RoonApiBrowse.browse({ hierarchy: "search", pop_all: true, set_display_offset: true });
  const b0 = await server.services.RoonApiBrowse.browse({ hierarchy: "browse", input: query, zone_or_output_id: zone_id });
  let l0 = await server.services.RoonApiBrowse.load({ hierarchy: "browse", level: b0.list?.level });
  // BFS through search results to find an album list
  type Node = { key: string; depth: number; title?: string };
  const queue: Node[] = [];
  const visited = new Set<string>();
  for (const it of l0.items) {
    if (it.item_key) queue.push({ key: it.item_key, depth: 1, title: it.title });
  }
  const isAlbumsToken = (t?: string) => !!t && (lower(t).includes("album") || lower(t).includes("recording") || lower(t).includes("release"));
  while (queue.length > 0) {
    const { key, depth, title } = queue.shift()!;
    if (visited.has(key) || depth > 6) continue;
    visited.add(key);
    const b = await server.services.RoonApiBrowse.browse({ hierarchy: "browse", item_key: key, zone_or_output_id: zone_id });
    const l = await server.services.RoonApiBrowse.load({ hierarchy: "browse", level: b.list?.level });
    if (l.list.hint !== "action_list") {
      if (isAlbumsToken(title)) {
        const item = await pickRandomFromLoadedListGeneric(server, "albums", l);
        return item ? { item, hierarchy: "albums" } : undefined;
      } else {
        const item = await pickRandomFromLoadedListGeneric(server, "albums", l);
        if (item) return { item, hierarchy: "albums" };
        continue;
      }
    }
    const prioritized = l.items.filter((it) => it.item_key && isAlbumsToken(it.title));
    const others = l.items.filter((it) => it.item_key && !prioritized.includes(it));
    for (const it of [...prioritized, ...others]) {
      queue.push({ key: it.item_key!, depth: depth + 1, title: it.title });
    }
  }
  return undefined;
}

async function pickRandomAlbumUsingFocus(
  server: FoundZone["server"],
  zone_id: string,
  genreTitle: string
): Promise<SourcedItem | undefined> {
  const lower = (s?: string) => (s ? s.toLowerCase() : "");
  const gt = lower(genreTitle);
  logger.debug("random: using Focus path for genre '%s'", genreTitle);
  // reset albums
  await server.services.RoonApiBrowse.browse({ hierarchy: "albums", pop_all: true, set_display_offset: true });
  const albumsBrowse = await server.services.RoonApiBrowse.browse({ hierarchy: "albums", zone_or_output_id: zone_id });
  let albumsLoad = await server.services.RoonApiBrowse.load({ hierarchy: "albums", level: albumsBrowse.list?.level });
  logTitles("albums/root", albumsLoad);

  // Find and open Focus
  const focusLoad = (await openActionByTokens(server, "albums", albumsLoad, ["focus"], zone_id))
    ?? (await openActionByTokens(server, "albums", albumsLoad, ["filter"], zone_id))
    ?? (await openActionByTokens(server, "albums", albumsLoad, ["filters"], zone_id))
    ?? (await openActionByTokens(server, "albums", albumsLoad, ["browser filters"], zone_id))
    ?? (await openActionByTokens(server, "albums", albumsLoad, ["fokus"], zone_id)) // common localized variants
    ?? (await openActionByTokens(server, "albums", albumsLoad, ["filteren"], zone_id))
    ?? (await openActionByTokens(server, "albums", albumsLoad, ["filtre"], zone_id))
    ?? (await openActionByTokens(server, "albums", albumsLoad, ["filtro"], zone_id))
    ?? (await openActionByTokens(server, "albums", albumsLoad, ["gen"], zone_id));
  if (!focusLoad) {
    logger.debug("random: Focus not found under Albums");
    logTitles("albums/candidates-for-focus", albumsLoad);
    return undefined;
  }

  // Open Genres inside Focus
  const genresLoad = (await openActionByTokens(server, "albums", focusLoad, ["genre"], zone_id))
    ?? (await openActionByTokens(server, "albums", focusLoad, ["genres"], zone_id))
    ?? (await openActionByTokens(server, "albums", focusLoad, ["stijl"], zone_id))
    ?? (await openActionByTokens(server, "albums", focusLoad, ["stijl", "genres"], zone_id))
    ?? (await openActionByTokens(server, "albums", focusLoad, ["genre", "focus"], zone_id))
    ?? (await openActionByTokens(server, "albums", focusLoad, ["category"], zone_id))
    ?? (await openActionByTokens(server, "albums", focusLoad, ["categories"], zone_id))
    ?? (await openActionByTokens(server, "albums", focusLoad, ["style"], zone_id))
    ?? (await openActionByTokens(server, "albums", focusLoad, ["styles"], zone_id))
    ?? (await openActionByTokens(server, "albums", focusLoad, ["tag"], zone_id))
    ?? (await openActionByTokens(server, "albums", focusLoad, ["tags"], zone_id));
  if (!genresLoad) {
    logger.debug("random: Genres not found inside Focus");
    logTitles("albums/focus-items", focusLoad);
    return undefined;
  }
  logTitles("albums/focus-genres", genresLoad);

  // BFS to find the target genre title and select it
  const selected = await selectItemByExactTitle(server, "albums", genresLoad, genreTitle, zone_id);
  if (!selected) {
    logger.debug("random: genre '%s' not found inside Focus/Genres", genreTitle);
    return undefined;
  }

  // Look for Apply and trigger it
  const applied = (await triggerActionByTokens(server, "albums", selected, ["apply"], zone_id))
    || (await triggerActionByTokens(server, "albums", selected, ["done"], zone_id))
    || (await triggerActionByTokens(server, "albums", selected, ["ok"], zone_id))
    || (await triggerActionByTokens(server, "albums", selected, ["apply", "focus"], zone_id));
  if (!applied) {
    logger.debug("random: Apply not found after selecting genre '%s'", genreTitle);
    return undefined;
  }

  // We should be back to a filtered albums list now
  const afterApplyBrowse = await server.services.RoonApiBrowse.browse({ hierarchy: "albums", zone_or_output_id: zone_id });
  let afterApplyLoad = await server.services.RoonApiBrowse.load({ hierarchy: "albums", level: afterApplyBrowse.list?.level });
  logTitles("albums/after-apply", afterApplyLoad);
  if (afterApplyLoad.list.hint === "action_list") {
    // find action that leads to items
    const itemsAction = afterApplyLoad.items.find((i) => i.item_key && (!i.hint || i.hint !== "action_list"));
    if (itemsAction?.item_key) {
      const nb = await server.services.RoonApiBrowse.browse({ hierarchy: "albums", item_key: itemsAction.item_key });
      afterApplyLoad = await server.services.RoonApiBrowse.load({ hierarchy: "albums", level: nb.list?.level });
    }
  }
  // pick random album
  const total = afterApplyLoad.list.count ?? 0;
  if (!total || total <= 0) return undefined;
  const randomIndex = Math.floor(Math.random() * total);
  const pageOffset = Math.floor(randomIndex / 100) * 100;
  const page = await server.services.RoonApiBrowse.load({ hierarchy: "albums", level: afterApplyLoad.list.level, offset: pageOffset, count: 100 });
  return { item: page.items[randomIndex - pageOffset], hierarchy: "albums" };
}

async function openActionByTokens(
  server: FoundZone["server"],
  hierarchy: "albums" | "genres",
  startLoad: RoonApiBrowseLoadResponse,
  tokens: string[],
  zone_id?: string
): Promise<RoonApiBrowseLoadResponse | undefined> {
  const lower = (s?: string) => (s ? s.toLowerCase() : "");
  type Node = { key: string; depth: number; title?: string };
  const queue: Node[] = [];
  const visited = new Set<string>();
  for (const it of startLoad.items) {
    if (it.item_key) queue.push({ key: it.item_key, depth: 1, title: it.title });
  }
  const matches = (t?: string) => (t ? tokens.every((tk) => lower(t).includes(lower(tk))) : false);
  while (queue.length > 0) {
    const { key, depth, title } = queue.shift()!;
    if (visited.has(key) || depth > 4) continue;
    visited.add(key);
    const b = await server.services.RoonApiBrowse.browse({ hierarchy, item_key: key, zone_or_output_id: zone_id });
    const l = await server.services.RoonApiBrowse.load({ hierarchy, level: b.list?.level });
    if (matches(title)) {
      return l;
    }
    if (l.list.hint === "action_list") {
      for (const it of l.items) {
        if (it.item_key) queue.push({ key: it.item_key, depth: depth + 1, title: it.title });
      }
    }
  }
  return undefined;
}

async function selectItemByExactTitle(
  server: FoundZone["server"],
  hierarchy: "albums" | "genres",
  startLoad: RoonApiBrowseLoadResponse,
  title: string,
  zone_id?: string
): Promise<RoonApiBrowseLoadResponse | undefined> {
  const wanted = title.trim().toLowerCase();
  type Node = { key: string; depth: number; title?: string };
  const queue: Node[] = [];
  const visited = new Set<string>();
  for (const it of startLoad.items) {
    if (it.item_key) queue.push({ key: it.item_key, depth: 1, title: it.title });
  }
  while (queue.length > 0) {
    const { key, depth, title } = queue.shift()!;
    if (visited.has(key) || depth > 6) continue;
    visited.add(key);
    const b = await server.services.RoonApiBrowse.browse({ hierarchy, item_key: key, zone_or_output_id: zone_id });
    const l = await server.services.RoonApiBrowse.load({ hierarchy, level: b.list?.level });
    if ((title ?? "").trim().toLowerCase() === wanted) {
      return l;
    }
    if (l.list.hint === "action_list") {
      for (const it of l.items) {
        if (it.item_key) queue.push({ key: it.item_key, depth: depth + 1, title: it.title });
      }
    }
  }
  return undefined;
}

async function triggerActionByTokens(
  server: FoundZone["server"],
  hierarchy: "albums" | "genres",
  startLoad: RoonApiBrowseLoadResponse,
  tokens: string[],
  zone_id?: string
): Promise<boolean> {
  const lower = (s?: string) => (s ? s.toLowerCase() : "");
  type Node = { key: string; depth: number; title?: string };
  const queue: Node[] = [];
  const visited = new Set<string>();
  for (const it of startLoad.items) {
    if (it.item_key) queue.push({ key: it.item_key, depth: 1, title: it.title });
  }
  const matches = (t?: string) => (t ? tokens.every((tk) => lower(t).includes(lower(tk))) : false);
  while (queue.length > 0) {
    const { key, depth, title } = queue.shift()!;
    if (visited.has(key) || depth > 6) continue;
    visited.add(key);
    if (matches(title)) {
      await server.services.RoonApiBrowse.browse({ hierarchy, item_key: key, zone_or_output_id: zone_id });
      return true;
    }
    const b = await server.services.RoonApiBrowse.browse({ hierarchy, item_key: key });
    const l = await server.services.RoonApiBrowse.load({ hierarchy, level: b.list?.level });
    if (l.list.hint === "action_list") {
      for (const it of l.items) {
        if (it.item_key) queue.push({ key: it.item_key, depth: depth + 1, title: it.title });
      }
    }
  }
  return false;
}

function logTitles(prefix: string, load: RoonApiBrowseLoadResponse) {
  try {
    const titles = load.items.map((i) => i.title ?? i.item_key ?? "");
    logger.debug("random: %s items -> %s", prefix, JSON.stringify(titles));
  } catch {
    // ignore logging errors
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


async function reselectAlbumByTitle(
  server: FoundZone["server"],
  zone_id: string,
  selected: SourcedItem
): Promise<{ item_key?: string }> {
  const titleLc = (selected.item.title ?? '').trim().toLowerCase();
  // reopen genre -> albums
  const genreBrowse = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", pop_all: true, set_display_offset: true });
  const root = await server.services.RoonApiBrowse.browse({ hierarchy: "genres" });
  const level = root.list?.level;
  const genres = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level });
  // Try to find the genre node containing the current album list title via contains match on the previously used genre title is not tracked here; best effort: scan for Albums child and find title
  for (const g of genres.items) {
    if (!g.item_key) continue;
    const gb = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: g.item_key, zone_or_output_id: zone_id });
    const gl = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: gb.list?.level });
    const albumsChild = gl.items.find((it) => (it.title ?? '').toLowerCase().includes('albums') && it.item_key);
    if (!albumsChild?.item_key) continue;
    const ab = await server.services.RoonApiBrowse.browse({ hierarchy: "genres", item_key: albumsChild.item_key, zone_or_output_id: zone_id });
    const al = await server.services.RoonApiBrowse.load({ hierarchy: "genres", level: ab.list?.level });
    const match = al.items.find((it) => (it.title ?? '').trim().toLowerCase() === titleLc);
    if (match?.item_key) return { item_key: match.item_key };
  }
  return { item_key: selected.item.item_key };
}
