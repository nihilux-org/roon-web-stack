import { extensionMock, loggerMock } from "@mock";

import { extension_version, logger } from "@infrastructure";
import {
  OutputListener,
  Roon,
  RoonApiBrowse,
  RoonApiBrowseLoadOptions,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseOptions,
  RoonApiBrowseResponse,
  RoonApiImage,
  RoonApiImageResultOptions,
  RoonApiTransportZones,
  RoonServer,
  RoonSubscriptionResponse,
  ServerListener,
  SharedConfig,
  SharedConfigMessage,
  ZoneListener,
} from "@model";

describe("roon-extension.ts test suite", () => {
  let roon: Roon;

  beforeEach(() => {
    jest.isolateModules((): void => {
      import("./roon-extension")
        .then((module) => {
          roon = module.roon;
        })
        .catch((err: unknown) => {
          logger.error(err);
        });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("roon#onServerPaired should delegate to the underlying RoonExtension#on('core_paired')", () => {
    let core = null;
    const listener: ServerListener = (server) => {
      core = server;
    };
    const server = {} as unknown as RoonServer;
    let passedEventName = null;
    extensionMock.on.mockImplementation((eventName: string, listener: ServerListener): void => {
      passedEventName = eventName;
      listener(server);
    });

    roon.onServerPaired(listener);

    expect(core).toBe(server);
    expect(passedEventName).toEqual("core_paired");
  });

  it("roon#onServerLost should delegate to the underlying RoonExtension#on('core_unpaired')", () => {
    let core = null;
    const listener: ServerListener = (server) => {
      core = server;
    };
    const server = {} as unknown as RoonServer;
    let passedEventName = null;
    extensionMock.on.mockImplementation((eventName: string, listener: ServerListener): void => {
      passedEventName = eventName;
      listener(server);
    });

    roon.onServerLost(listener);

    expect(core).toBe(server);
    expect(passedEventName).toEqual("core_unpaired");
  });

  it("roon#server should return the same Promise as RoonExtension#get_core", async () => {
    const core = {} as unknown as RoonServer;
    extensionMock.get_core.mockImplementation(() => Promise.resolve(core));

    const result = await roon.server();

    expect(result).toEqual(core);
  });

  it("roon#onZones should delegate to the underlying RoonExtension#on('subscribe_zones')", () => {
    let passedCore = null;
    let passedResponse = null;
    let passedBody = null;
    const listener: ZoneListener = (server, response, body) => {
      passedCore = server;
      passedResponse = response;
      passedBody = body;
    };
    const core = {} as unknown as RoonServer;
    const response = "" as unknown as RoonSubscriptionResponse;
    const body = {} as unknown as RoonApiTransportZones;
    let passedEventName = null;
    extensionMock.on.mockImplementation((eventName: string, listener: ZoneListener): void => {
      passedEventName = eventName;
      listener(core, response, body);
    });

    roon.onZones(listener);

    expect(passedEventName).toEqual("subscribe_zones");
    expect(passedCore).toBe(core);
    expect(passedResponse).toBe(response);
    expect(passedBody).toBe(body);
  });

  it("roon#offZones should delegate to the underlying RoonExtension#off('subscribe_zones')", () => {
    let passedCore = null;
    let passedResponse = null;
    let passedBody = null;
    const listener: ZoneListener = (server, response, body) => {
      passedCore = server;
      passedResponse = response;
      passedBody = body;
    };
    const core = {} as unknown as RoonServer;
    const response = "" as unknown as RoonSubscriptionResponse;
    const body = {} as unknown as RoonApiTransportZones;
    let passedEventName = null;
    extensionMock.off.mockImplementation((eventName: string, listener: ZoneListener): void => {
      passedEventName = eventName;
      listener(core, response, body);
    });

    roon.offZones(listener);

    expect(passedEventName).toEqual("subscribe_zones");
    expect(passedCore).toBe(core);
    expect(passedResponse).toBe(response);
    expect(passedBody).toBe(body);
  });

  it("roon#onOutputs should delegate to the underlying RoonExtension#on('subscribe_outputs')", () => {
    let passedCore = null;
    let passedResponse = null;
    let passedBody = null;
    const listener: OutputListener = (server, response, body) => {
      passedCore = server;
      passedResponse = response;
      passedBody = body;
    };
    const core = {} as unknown as RoonServer;
    const response = "" as unknown as RoonSubscriptionResponse;
    const body = {} as unknown as RoonApiTransportZones;
    let passedEventName = null;
    extensionMock.on.mockImplementation((eventName: string, listener: ZoneListener): void => {
      passedEventName = eventName;
      listener(core, response, body);
    });

    roon.onOutputs(listener);

    expect(passedEventName).toEqual("subscribe_outputs");
    expect(passedCore).toBe(core);
    expect(passedResponse).toBe(response);
    expect(passedBody).toBe(body);
  });

  it("roon#offOutputs should delegate to the underlying RoonExtension#off('subscribe_outputs')", () => {
    let passedCore = null;
    let passedResponse = null;
    let passedBody = null;
    const listener: OutputListener = (server, response, body) => {
      passedCore = server;
      passedResponse = response;
      passedBody = body;
    };
    const core = {} as unknown as RoonServer;
    const response = "" as unknown as RoonSubscriptionResponse;
    const body = {} as unknown as RoonApiTransportZones;
    let passedEventName = null;
    extensionMock.off.mockImplementation((eventName: string, listener: ZoneListener): void => {
      passedEventName = eventName;
      listener(core, response, body);
    });

    roon.offOutputs(listener);

    expect(passedEventName).toEqual("subscribe_outputs");
    expect(passedCore).toBe(core);
    expect(passedResponse).toBe(response);
    expect(passedBody).toBe(body);
  });

  it("roon#startExtension should call RoonExtension#start_discovery", () => {
    let started = false;
    extensionMock.start_discovery.mockImplementation(() => {
      started = true;
    });

    roon.startExtension();

    expect(extensionMock.start_discovery).toHaveBeenCalled();
    expect(started).toBe(true);
  });

  it("roon#startExtension should run only once", () => {
    let started = false;
    extensionMock.start_discovery.mockImplementation(() => {
      started = true;
    });

    roon.startExtension();

    expect(extensionMock.start_discovery).toHaveBeenCalled();
    expect(started).toBe(true);

    started = false;

    roon.startExtension();
    expect(extensionMock.start_discovery).toHaveBeenCalledTimes(1);
    expect(started).toBe(false);

    expect(loggerMock.info).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith(
      "starting discovery, don't forget to enable the extension in roon settings if needed."
    );
  });

  it("roon#startExtension should register the default onServerPaired listener", () => {
    extensionMock.start_discovery.mockImplementation(() => {});
    let registeredListener = null;
    extensionMock.on.mockImplementation((eventName: string, listener: ServerListener) => {
      if (eventName === "core_paired") {
        registeredListener = listener;
      }
    });

    roon.startExtension();

    expect(extensionMock.set_status).toHaveBeenCalledWith("starting...");
    expect(registeredListener).not.toBeNull();
    expect(registeredListener).toBeInstanceOf(Function);

    const server = {
      display_name: "display_name",
      core_id: "core_id",
      display_version: "display_version",
    } as unknown as RoonServer;
    const listener: ServerListener = registeredListener as unknown as ServerListener;
    listener(server);
    expect(extensionMock.set_status).toHaveBeenCalledWith("paired, port in use: 3000");
    expect(loggerMock.info).toHaveBeenCalledWith(
      `extension version: ${extension_version}, paired roon server: display_name (vdisplay_version - core_id)`
    );
    expect(extensionMock.api().load_config).toHaveBeenCalledWith("shared_config_key");
  });

  it("roon#startExtension should register the default onServerLost listener", () => {
    extensionMock.start_discovery.mockImplementation(() => {});
    let registeredListener = null;
    extensionMock.on.mockImplementation((eventName: string, listener: ServerListener) => {
      if (eventName === "core_unpaired") {
        registeredListener = listener;
      }
    });

    roon.startExtension();

    expect(registeredListener).not.toBeNull();
    expect(registeredListener).toBeInstanceOf(Function);

    const server = {
      display_name: "display_name",
      core_id: "core_id",
      display_version: "display_version",
    } as unknown as RoonServer;
    const listener: ServerListener = registeredListener as unknown as ServerListener;
    listener(server);
    expect(loggerMock.warn).toHaveBeenCalledWith("lost roon server: display_name (vdisplay_version - core_id)");
    expect(loggerMock.info).toHaveBeenCalledWith("waiting for adoption...");
  });

  it("roon#getImage should return the same Promise as the one returned by RoonApiImage wrapped in RoonExtension", async () => {
    const imageResponse: { content_type: string; image: Buffer } = {
      content_type: "image/jpeg",
      image: Buffer.from("buffer"),
    };
    const get_image = jest.fn().mockImplementation(() => Promise.resolve(imageResponse));
    const roonApiImage: RoonApiImage = {
      get_image,
    };
    const server: RoonServer = {
      services: {
        RoonApiImage: roonApiImage,
      },
    } as unknown as RoonServer;
    extensionMock.get_core.mockImplementation(() => Promise.resolve(server));
    const image_key = "image_key";
    const options: RoonApiImageResultOptions = {
      format: "image/png",
      height: 420,
      scale: "fit",
      width: 420,
    };
    const result = await roon.getImage(image_key, options);
    expect(result).toBe(imageResponse);
    expect(get_image).toHaveBeenCalledWith(image_key, options);
    const error = new Error("InvalidRequest");
    get_image.mockImplementation(() => Promise.reject(error));
    const rejectedPromise = roon.getImage(image_key, options);
    void expect(rejectedPromise).rejects.toBe(error);
  });

  it("roon#browse should return the same Promise as the one returned by RoonApiBrowse#browse wrapped in RoonExtension", async () => {
    const browseResponse: RoonApiBrowseResponse = {
      list: {
        count: 42,
        image_key: "image_key",
        level: 420,
        display_offset: 4242,
        title: "title",
      },
      action: "action",
    };
    const browse = jest.fn().mockImplementation(() => Promise.resolve(browseResponse));
    const server: RoonServer = {
      services: {
        RoonApiBrowse: {
          browse,
        } as unknown as RoonApiBrowse,
      },
    } as unknown as RoonServer;
    extensionMock.get_core.mockImplementation(() => Promise.resolve(server));
    const options: RoonApiBrowseOptions = {
      item_key: "item_key",
      hierarchy: "browse",
    };
    const result = await roon.browse(options);
    expect(result).toBe(browseResponse);
    expect(browse).toHaveBeenCalledWith(options);
    const error = new Error("error");
    browse.mockImplementation(() => Promise.reject(error));
    const rejectedPromise = roon.browse(options);
    void expect(rejectedPromise).rejects.toBe(error);
  });

  it("roon#load should return the same Promise as the one returned by RoonApiBrowse#load wrapped in RoonExtension", async () => {
    const loadResponse: RoonApiBrowseLoadResponse = {
      items: [],
      list: {
        count: 42,
        image_key: "image_key",
        level: 420,
        display_offset: 4242,
        title: "title",
      },
      offset: 42,
    };
    const load = jest.fn().mockImplementation(() => Promise.resolve(loadResponse));
    const server: RoonServer = {
      services: {
        RoonApiBrowse: {
          load,
        } as unknown as RoonApiBrowse,
      },
    } as unknown as RoonServer;
    extensionMock.get_core.mockImplementation(() => Promise.resolve(server));
    const options: RoonApiBrowseLoadOptions = {
      hierarchy: "browse",
      multi_session_key: "multi_session_key",
    };
    const result = await roon.load(options);
    expect(result).toBe(loadResponse);
    expect(load).toHaveBeenCalledWith(options);
    const error = new Error("error");
    load.mockImplementation(() => Promise.reject(error));
    const rejectedPromise = roon.load(options);
    void expect(rejectedPromise).rejects.toBe(error);
  });

  it("roon#sharedConfigEvents should throw an Error if called before server pairing", () => {
    expect(() => roon.sharedConfigEvents()).toThrow(new Error("server has not be paired yet!"));
  });

  it("roon#sharedConfigEvents should return an Observable containing the last known SharedConfig", async () => {
    let registeredListener = null;
    extensionMock.on.mockImplementation((eventName: string, listener: ServerListener) => {
      if (eventName === "core_paired") {
        registeredListener = listener;
      }
    });
    roon.startExtension();
    const server = {} as unknown as RoonServer;
    const listener: ServerListener = registeredListener as unknown as ServerListener;
    listener(server);

    const events = roon.sharedConfigEvents();

    let hasConfig = false;
    await new Promise<void>((resolve) => {
      events.subscribe((evt) => {
        expect(evt).not.toBeNull();
        hasConfig = true;
        resolve();
      });
    });
    expect(hasConfig).toBeTruthy();
  });

  it("roon#saveSharedConfig should call RoonApi#save_config with the provided value and the key 'shared_config_key' and publish the freshly saved config", () => {
    let registeredListener = null;
    extensionMock.on.mockImplementation((eventName: string, listener: ServerListener) => {
      if (eventName === "core_paired") {
        registeredListener = listener;
      }
    });
    roon.startExtension();
    const server = {} as unknown as RoonServer;
    const listener: ServerListener = registeredListener as unknown as ServerListener;
    listener(server);
    const sharedConfigevents = roon.sharedConfigEvents();
    const sharedConfigMessages: SharedConfigMessage[] = [];
    sharedConfigevents.subscribe((msg) => sharedConfigMessages.push(msg));
    const sharedConfig: SharedConfig = {
      customActions: [
        {
          id: "id",
          label: "label",
          icon: "icon",
          roonPath: {
            hierarchy: "browse",
            path: [],
          },
        },
      ],
    };
    roon.saveSharedConfig(sharedConfig);
    expect(extensionMock.api().save_config).toHaveBeenCalledWith("shared_config_key", sharedConfig);
    expect(sharedConfigMessages).toHaveLength(2);
    expect(sharedConfigMessages[1].data).toBe(sharedConfig);
  });
});
