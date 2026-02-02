import { BehaviorSubject, Observable, Subject } from "rxjs";
import { hostInfo, logger } from "@infrastructure";
import {
  AudioInputSessionManager,
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
} from "@nihilux/roon-web-model";
import { Extension } from "@roon-kit";
import { settingsOptions } from "./roon-extension-settings";

export const extension_version = "0.0.13-beta-9";

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
  RoonApiAudioInput: "required",
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
  onZones(onZonesDefaultSettingsListener);
};

const onZonesDefaultSettingsListener: ZoneListener = (server: RoonServer, response, body) => {
  const settingsManager = roon.settings();
  /* v8 ignore else --@preserve */
  if (settingsManager !== undefined) {
    const settings = settingsManager.settings();
    let settingsZones = settings.nr_audio_input_zones;
    let updateSettings = false;
    switch (response) {
      case "Subscribed":
        updateSettings = true;
        if (body.zones !== undefined) {
          settingsZones = body.zones
            .map((z) => ({
              zone_name: z.display_name,
              zone_id: z.zone_id,
            }))
            .sort((z1, z2) => z1.zone_name.localeCompare(z2.zone_name));
        } else {
          settingsZones = [];
        }
        break;
      case "Changed":
        if (body.zones_added !== undefined) {
          updateSettings = true;
          settingsZones.push(
            ...body.zones_added.map((z) => ({
              zone_name: z.display_name,
              zone_id: z.zone_id,
            }))
          );
          settingsZones.sort((z1, z2) => z1.zone_name.localeCompare(z2.zone_name));
        }
        if (body.zones_removed !== undefined) {
          updateSettings = true;
          settingsZones = settingsZones.filter((z) => !body.zones_removed?.includes(z.zone_id));
        }
        if (body.zones_changed !== undefined) {
          for (const zone of body.zones_changed) {
            const changedZone = settingsZones.find((z) => z.zone_id === zone.zone_id);
            /* v8 ignore else --@preserve */
            if (changedZone !== undefined && changedZone.zone_name !== zone.display_name) {
              updateSettings = true;
              changedZone.zone_name = zone.display_name;
            }
          }
        }
        break;
      case "Unsubscribed":
        updateSettings = true;
        settingsZones = [];
        break;
    }
    /* v8 ignore else --@preserve */
    if (updateSettings) {
      const defaultZoneValid =
        settingsZones.findIndex((z) => z.zone_id === settings.nr_audio_input_default_zone) !== -1;
      settingsManager.updateSettings({
        ...settings,
        nr_audio_input_default_zone: defaultZoneValid ? settings.nr_audio_input_default_zone : "",
        nr_audio_input_zones: settingsZones,
      });
    }
  }
};

const onServerLostDefaultListener: ServerListener = (server: RoonServer) => {
  logger.warn(`lost roon server: ${server.display_name} (v${server.display_version} - ${server.core_id})`);
  logger.info(`waiting for adoption...`);
  offZones(onZonesDefaultSettingsListener);
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

let mustBeStarted = true;

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
): Promise<{ content_type: string; image: Uint8Array }> => {
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

const audioInputSessionManager = (): AudioInputSessionManager | undefined => {
  return extension.audioInputSessionManager();
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
  audioInputSessionManager,
};
