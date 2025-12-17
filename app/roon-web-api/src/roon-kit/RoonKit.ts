import {
  RoonApi,
  RoonApiBrowse,
  RoonApiImage,
  RoonApiOptions,
  RoonApiSettings,
  RoonApiStatus,
  RoonApiTransport,
  RoonServer,
  SaveSettingsStatus,
  SettingsValues,
  SettingsLayout, RoonApiAudioInput, RoonApiAudioInputSession,
} from "@nihilux/roon-web-model";

/**
 * Shared types and functions.
 *
 * #### Remarks
 * The `RoonKit` class exposes types for all of the classes & services it imports from the various
 * `node-roon-api-XXXX` packages. Applications working directly with the imported api classes should
 * call the [[RoonKit.createRoonApi]] method when creating new instances of the [[RoonKit.RoonApi]]
 * class. This is the only way to ensure that all of the API's services are properly converted to
 * being promise based.
 */
export class RoonKit {
  /**
   * [[RoonApi]] class imported from 'node-roon-api' package.
   */
  public static readonly RoonApi: new (
    options: RoonApiOptions
  ) => RoonApi = require("node-roon-api");

  /**
   * [[RoonApiBrowse]] service imported from 'node-roon-api-browse' package.
   */
  public static readonly RoonApiBrowse: new () => RoonApiBrowse = require("node-roon-api-browse");

  /**
   * [[RoonApiImage]] service imported from 'node-roon-api-image' package.
   */
  public static readonly RoonApiImage: new () => RoonApiImage = require("node-roon-api-image");

  /**
   * [[RoonApiStatus]] service imported from 'node-roon-api-status' package.
   */
  public static readonly RoonApiStatus: new (
    roon: RoonApi
  ) => RoonApiStatus = require("node-roon-api-status");

  /**
   * [[RoonApiTransport]] service imported from 'node-roon-api-transport' package.
   */
  public static readonly RoonApiTransport: new () => RoonApiTransport = require("node-roon-api-transport");

  /**
   * [[RoonApiSettings]] service imported from 'node-roon-api-settings' package.
   */
  public static readonly RoonApiSettings: new <T extends SettingsValues>(roon: RoonApi, options: {
    save_settings: (
      req: { send_complete: (status: SaveSettingsStatus, settings: { settings: SettingsLayout<T> }) => void },
      isDryRun: boolean,
      settingToSave: { values: Partial<T> }
    ) => void;
    get_settings: (sendSettings: (settingsLayout: SettingsLayout<T>) => void) => void
  }) => RoonApiSettings<T> = require("node-roon-api-settings");

  /**
   * [[RoonApiAudioInput]] service imported from 'node-roon-api-audioinput' package.
   */
  public static readonly RoonApiAudioInput: new () => RoonApiAudioInput = require("node-roon-api-audioinput");

  /**
   * Creates a new [[RoonApi]] instance.
   * @param options Options used to configure roon API.
   * @returns Created [[RoonApi]] instance.
   */
  public static createRoonApi(options: RoonApiOptions): RoonApi {
    // Patch core callbacks
    for (const key in options) {
      switch (key) {
        case "core_paired":
        case "core_unpaired":
        case "core_found":
        case "core_lost":
          const cb = options[key] as CoreCallback;
          if (typeof cb == "function") {
            options[key] = (core: RoonServer) => {
              cb(proxyCore(core));
            };
          }
          break;
      }
    }

    // Create API
    return new RoonKit.RoonApi(options);
  }
}

type CoreCallback = (core: RoonServer) => void;

interface RoonCoreProxy extends RoonServer {
  isProxy?: boolean;
}

function proxyCore(core: RoonCoreProxy): RoonServer {
  if (!core.isProxy) {
    // Proxy services
    if (core.services.RoonApiBrowse) {
      (core.services as any).RoonApiBrowse = proxyBrowse(
        core.services.RoonApiBrowse
      );
    }

    if (core.services.RoonApiImage) {
      (core.services as any).RoonApiImage = proxyImage(
        core.services.RoonApiImage
      );
    }

    if (core.services.RoonApiTransport) {
      (core.services as any).RoonApiTransport = proxyTransport(
        core.services.RoonApiTransport
      );
    }

    if (core.services.RoonApiAudioInput) {
      (core.services as any).RoonApiAudioInput = proxyAudioInput(
        core.services.RoonApiAudioInput
      )
    }

    core.isProxy = true;
  }

  return core;
}

function proxyBrowse(browse: RoonApiBrowse): RoonApiBrowse {
  return new Proxy(browse, {
    get(t, p, r) {
      let v: any = Reflect.get(t, p, r);
      switch (p) {
        case "browse":
        case "load":
          const fn = v as Function;
          v = (...args: any[]) => {
            return new Promise((resolve, reject) => {
              args.push((err: string | false, body: any) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(body);
                }
              });
              fn.apply(t, args);
            });
          };
          break;
      }

      return v;
    },
  });
}

function proxyImage(image: RoonApiImage): RoonApiImage {
  return new Proxy(image, {
    get(t, p, r) {
      let v: any = Reflect.get(t, p, r);
      switch (p) {
        case "get_image":
          const fn = v as Function;
          v = (...args: any[]) => {
            return new Promise((resolve, reject) => {
              args.push(
                (err: string | false, content_type: string, image: Buffer) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({ content_type, image });
                  }
                }
              );
              fn.apply(t, args);
            });
          };
          break;
      }

      return v;
    },
  });
}

function proxyTransport(transport: RoonApiTransport): RoonApiTransport {
  return new Proxy(transport, {
    get(t, p, r) {
      let fn: Function;
      let v: any = Reflect.get(t, p, r);
      switch (p) {
        case "change_settings":
        case "change_volume":
        case "control":
        case "convenience_switch":
        case "group_outputs":
        case "mute":
        case "mute_all":
        case "pause_all":
        case "seek":
        case "standby":
        case "toggle_standby":
        case "transfer_zone":
        case "ungroup_outputs":
          fn = v;
          v = (...args: any[]) => {
            return new Promise<void>((resolve, reject) => {
              args.push((err: string | false) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
              fn.apply(t, args);
            });
          };
          break;
        case "get_outputs":
        case "get_zones":
        case "play_from_here":
          fn = v;
          v = (...args: any[]) => {
            return new Promise((resolve, reject) => {
              args.push((err: string | false, body: any) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(body);
                }
              });
              fn.apply(t, args);
            });
          };
          break;
      }

      return v;
    },
  });
}

function proxyAudioInput(audioInput: RoonApiAudioInput) {
  return new Proxy(audioInput, {
    get(t, p, r) {
      let fn: Function;
      let v: any = Reflect.get(t, p, r);
      switch (p) {
        case "begin_session":
          fn = v;
          v = (...args: any[]) => {
            return new Promise<RoonApiAudioInputSession>((resolve, reject) => {
              const session = fn.apply(t, args);
              session.end = function() {
                const _session = this;
                return new Promise<void>((end_session_resolve, end_session_reject) => {
                  _session.end_session(() => {
                    end_session_resolve();
                  });
                });
              }
              resolve(session);
            });
          };
          break;
        case "clear":
        case "update_track_info":
        case "update_transport_info":
          fn = v;v = (...args: any[]) => {
            return new Promise<void>((resolve, reject) => {
              args.push((err: string | false) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
              fn.apply(t, args);
            });
          };
          break;
      }
      return v;
    }
  })
}
