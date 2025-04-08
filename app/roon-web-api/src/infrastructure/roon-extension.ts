import { BehaviorSubject, Observable, Subject } from "rxjs";
import { hostInfo, logger } from "@infrastructure";
import {
  EmptyObject,
  ExtensionSettings,
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
  SettingsManager,
  SharedConfig,
  SharedConfigMessage,
  SharedConfigUpdate,
  ZoneListener,
} from "@model";
import { Extension } from "@roon-kit";
import { settingsOptions } from "./roon-extension-settings";

export const extension_version = "0.0.11-beta-9";

const extension: RoonExtension<ExtensionSettings> = new Extension({
  description: {
    extension_id: "roon-web-stack",
    display_name: `roon web stack @${hostInfo.hostname}`,
    display_version: extension_version,
    publisher: "nihilux.org",
    email: "nihil@nihilux.org",
    website: `http://${hostInfo.ipV4}:${hostInfo.port}`,
  },
  RoonApiBrowse: "required",
  RoonApiImage: "required",
  RoonApiTransport: "required",
  RoonApiSettings: settingsOptions,
  subscribe_outputs: true,
  subscribe_zones: true,
  log_level: "none",
});

const onServerPaired = (listener: ServerListener): void => {
  extension.on("core_paired", listener);
};

const onServerPairedDefaultListener: ServerListener = (server: RoonServer) => {
  extension.set_status(`paired, exposed at http://${hostInfo.ipV4}:${hostInfo.port}`);
  logger.info(
    `extension version: ${extension_version}, paired roon server: ${server.display_name} (v${server.display_version} - ${server.core_id})`
  );
  publishSharedConfigMessage();
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
  return server.services.RoonApiBrowse.browse(options).catch((err: unknown) => {
    logger.error(err, "error during roon#browse");
    throw err;
  });
};

const load = async (options: RoonApiBrowseLoadOptions): Promise<RoonApiBrowseLoadResponse> => {
  const server = await extension.get_core();
  return server.services.RoonApiBrowse.load(options).catch((err: unknown) => {
    logger.error(err, "error during roon#load");
    throw err;
  });
};

const SHARED_CONFIG_KEY = "roon_web_stack_shared_config";
const EMPTY_SHARED_CONFIG: SharedConfig = {
  customActions: [],
};

const updateSharedConfig = (sharedConfigUpdate: SharedConfigUpdate): void => {
  const sharedConfig = extension.api().load_config<SharedConfig>(SHARED_CONFIG_KEY) ?? EMPTY_SHARED_CONFIG;
  let saveAndPublish = false;
  if (sharedConfigUpdate.customActions) {
    sharedConfig.customActions = sharedConfigUpdate.customActions;
    saveAndPublish = true;
  }
  if (saveAndPublish) {
    extension.api().save_config(SHARED_CONFIG_KEY, sharedConfig);
    publishSharedConfigMessage(sharedConfig);
  }
};

let sharedConfigSubject: Subject<SharedConfigMessage> | undefined;

const publishSharedConfigMessage = (sharedConfig?: SharedConfig): void => {
  const data = sharedConfig ?? extension.api().load_config<SharedConfig>(SHARED_CONFIG_KEY) ?? EMPTY_SHARED_CONFIG;
  const msg: SharedConfigMessage = {
    event: "config",
    data,
  };
  if (sharedConfigSubject == undefined) {
    sharedConfigSubject = new BehaviorSubject(msg);
  } else {
    sharedConfigSubject.next(msg);
  }
};

const sharedConfigEvents = (): Observable<SharedConfigMessage> => {
  if (sharedConfigSubject === undefined) {
    throw new Error("server has not be paired yet!");
  }
  return sharedConfigSubject;
};

const settings = (): SettingsManager<ExtensionSettings> | undefined => {
  return extension.settings();
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
  updateSharedConfig,
  sharedConfigEvents,
  settings,
};
