import * as process from "process";
import { logger } from "@infrastructure";
import {
  EmptyObject,
  OutputListener,
  Roon,
  RoonApiBrowseLoadOptions,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseOptions,
  RoonApiBrowseResponse,
  RoonApiImageResultOptions,
  RoonExtension,
  RoonServer,
  ServerListener,
  ZoneListener,
} from "@model";
import { Extension } from "@roon-kit";

export const extension_version = "0.0.5";

const extension: RoonExtension = new Extension({
  description: {
    extension_id: "roon-web-stack",
    display_name: "roon web stack",
    display_version: extension_version,
    publisher: "nihilux.org",
    email: "nihil@nihilux.org",
    website: "https://github.com/nihilux-org/roon-web-stack",
  },
  RoonApiBrowse: "required",
  RoonApiImage: "required",
  RoonApiTransport: "required",
  subscribe_outputs: true,
  subscribe_zones: true,
  log_level: "none",
});

const onServerPaired = (listener: ServerListener): void => {
  extension.on("core_paired", listener);
};

const onServerPairedDefaultListener: ServerListener = (server: RoonServer) => {
  extension.set_status(`paired, port in use: ${process.env["PORT"] ?? "3000"}`);
  logger.info(
    `extension version: ${extension_version}, paired roon server: ${server.display_name} (v${server.display_version} - ${server.core_id})`
  );
};

const onServerLostDefaultListener: ServerListener = (server: RoonServer) => {
  logger.warn(`lost roon server: ${server.display_name} (v${server.display_version} - ${server.core_id})`);
  logger.info(`waiting for adoption...`);
};

const onServerLost = (listener: ServerListener): void => {
  extension.on("core_unpaired", listener);
};

const server = async (): Promise<RoonServer> => extension.get_core();

const onZones = (listener: ZoneListener): void => {
  extension.on("subscribe_zones", listener);
};

const offZones = (listener: ZoneListener): void => {
  extension.off("subscribe_zones", listener);
};

const onOutputs = (outputListener: OutputListener): void => {
  extension.on("subscribe_outputs", outputListener);
};

const offOutputs = (outputListener: OutputListener): void => {
  extension.off("subscribe_outputs", outputListener);
};

let mustBeStarted: boolean = true;

const startExtension = (): void => {
  if (mustBeStarted) {
    mustBeStarted = false;
    onServerPaired(onServerPairedDefaultListener);
    onServerLost(onServerLostDefaultListener);
    logger.info("starting discovery, don't forget to enable the extension in roon settings if needed.");
    extension.start_discovery();
    extension.set_status("starting...");
  }
};

const getImage = async (
  image_key: string,
  options: RoonApiImageResultOptions
): Promise<{ content_type: string; image: Buffer }> => {
  const roonServer = await server();
  return roonServer.services.RoonApiImage.get_image(image_key, options);
};

const browse = async (options: RoonApiBrowseOptions | EmptyObject): Promise<RoonApiBrowseResponse> => {
  const server = await extension.get_core();
  return server.services.RoonApiBrowse.browse(options).catch((err) => {
    logger.error(err, "error during roon#browse");
    throw err;
  });
};

const load = async (options: RoonApiBrowseLoadOptions): Promise<RoonApiBrowseLoadResponse> => {
  const server = await extension.get_core();
  return server.services.RoonApiBrowse.load(options).catch((err) => {
    logger.error(err, "error during roon#load");
    throw err;
  });
};

export const roon: Roon = {
  onServerPaired,
  onServerLost,
  server,
  onZones,
  offZones,
  onOutputs,
  offOutputs,
  startExtension,
  getImage,
  browse,
  load,
};
