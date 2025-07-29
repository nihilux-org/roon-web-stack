import EventEmitter from "events";
import {
  ProvidedRoonServices,
  RequestedRoonServices,
  RoonApi,
  RoonApiStatus,
  RoonServer, RoonExtension,
  RoonExtensionOptions,
  RoonServiceRequired,
  SettingsValues,
  SettingsManager,
} from "@nihilux/roon-web-model";
import { TransientObject } from "./internals";
import { RoonKit } from "./RoonKit";
import { RoonExtensionSettings } from "./RoonExtensionSettings";

/**
 * Wrapper around the Roon API that simplifies initializing services and subscribing to zones.
 */
export class Extension<T extends SettingsValues> extends EventEmitter implements RoonExtension<T> {
  private _options: RoonExtensionOptions<T>;
  private readonly _api: RoonApi;
  private readonly _status: RoonApiStatus;
  private readonly _settings?: RoonExtensionSettings<T>;
  private _core?: TransientObject<RoonServer>;

  /**
   * Creates a new `RoonExtension` instance.
   * @param options Settings used to configure the extension.
   */
  constructor(options: RoonExtensionOptions<T>) {
    super();

    // Assign default options
    this._options = {
      ...options,
    };

    // Transport service is required if there are any subscriptions
    const hasSubscriptions =
      this._options.subscribe_outputs || this._options.subscribe_zones;
    if (hasSubscriptions) {
      this._options.RoonApiTransport = "required";
    }

    // Create API
    this._api = RoonKit.createRoonApi({
      ...options.description,
      log_level: options.log_level,
      core_paired: (newCore) => {
        const core = this._core!.resolve(newCore);
        this.emit("core_paired", core);

        // Setup subscriptions

        if (this._options.subscribe_outputs) {
          core.services.RoonApiTransport.subscribe_outputs((r, b) =>
            this.emit("subscribe_outputs", core, r, b)
          );
        }

        if (this._options.subscribe_zones) {
          core.services.RoonApiTransport.subscribe_zones((r, b) =>
            this.emit("subscribe_zones", core, r, b)
          );
        }
      },
      core_unpaired: (oldCore) => {
        this.emit("core_unpaired", oldCore);
        this._core!.dispose();
        this._core = new TransientObject();
      },
    });

    this._status = new RoonKit.RoonApiStatus(this._api);

    if (this._options.RoonApiSettings) {
      this._settings = new RoonExtensionSettings(this as RoonExtension<T>, this._options.RoonApiSettings);
    }
  }

  /**
   * Returns the extensions RoonApi instance.
   */
  public api(): RoonApi {
    return this._api;
  }

  /**
   * Initializes the extensions services and begins discovery.
   * @param provided_services Optional. Additional services provided by extension. RoonApiState is already provided so DO NOT add this service.
   */
  public start_discovery(provided_services: ProvidedRoonServices[] = []): void {
    if (this._core) {
      throw new Error(`RoonExtension: Discovery has already been started.`);
    }

    // Initialize transient object for to hold paired core
    this._core = new TransientObject();

    // Add RoonApiStatus to list of provided services.
    provided_services.push(this._status);

    if (this._settings) {
      provided_services.push(this._settings.service());
    }

    // Build list of required & optional services.
    const required_services: { new (): RequestedRoonServices }[] = [];
    const optional_services: { new (): RequestedRoonServices }[] = [];
    this.requireService(
      this._options.RoonApiBrowse,
      RoonKit.RoonApiBrowse,
      required_services,
      optional_services
    );
    this.requireService(
      this._options.RoonApiImage,
      RoonKit.RoonApiImage,
      required_services,
      optional_services
    );
    this.requireService(
      this._options.RoonApiTransport,
      RoonKit.RoonApiTransport,
      required_services,
      optional_services
    );

    // Initialize services
    this._api.init_services({
      required_services,
      optional_services,
      provided_services,
    });

    // Start discovery
    this._api.start_discovery();
  }

  /**
   * Sets the current status message for the extension.
   *
   * @remarks
   * If logging is enabled the message will also be written to the console.
   * @param message Extensions status message.
   * @param is_error Optional. If true an error occurred.
   */
  public set_status(message: string, is_error: boolean = false): void {
    this._status.set_status(message, is_error);
    if (this._options.log_level != "none") {
      if (is_error) {
        console.error(`Extension Error: ${message}`);
      } else {
        console.log(`Extension Status: ${message}`);
      }
    }
  }

  /**
   * Sets new options before discovery is started.
   *
   * @remarks
   * Used primarily by additional components that want to ensure the services they depend on are
   * initialized.
   *
   * Can only be called before `start_discover()` is called.
   * @param options Options to apply.
   */
  public update_options(options: Partial<RoonExtensionOptions<T>>): void {
    if (this._core) {
      throw new Error(
        `RoonExtension: Can't update options after discovery has been started.`
      );
    }

    this._options = Object.assign(this._options, options);
  }

  /**
   * Returns the current RoonCore. If there isn't one paired it waits.
   * @returns The current RoonCore that's paired.
   */
  public get_core(): Promise<RoonServer> {
    const transient = this.ensureStarted();
    return transient.getObject();
  }

  public settings(): SettingsManager<T> | undefined {
    return this._settings;
  }

  private ensureStarted(): TransientObject<RoonServer> {
    if (!this._core) {
      throw new Error(
        `RoonExtension: Discovery hasn't been started yet. Call start_discovery() first.`
      );
    }

    return this._core;
  }

  private requireService(
    setting: RoonServiceRequired | undefined,
    svc: { new (): RequestedRoonServices },
    required_services: { new (): RequestedRoonServices }[],
    optional_services: { new (): RequestedRoonServices }[]
  ): void {
    if (setting != undefined) {
      switch (setting) {
        case "required":
          required_services.push(svc);
          break;
        case "optional":
          optional_services.push(svc);
          break;
      }
    }
  }
}
