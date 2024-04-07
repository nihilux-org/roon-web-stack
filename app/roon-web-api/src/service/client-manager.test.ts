import { nanoidMock } from "@mock";
import { zoneManagerMock } from "../data/zone-manager.mock";
import { roonMock } from "../infrastructure/roon-extension.mock";
import { commandDispatcherMock } from "./command-dispatcher.mock";

import { Subject } from "rxjs";
import { logger } from "@infrastructure";
import {
  ClientManager,
  Command,
  CommandResult,
  CommandState,
  RoonApiBrowseLoadOptions,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseOptions,
  RoonApiBrowseResponse,
  RoonSseMessage,
  RoonState,
  ZoneDescription,
} from "@model";

describe("client-manager.ts test suite", () => {
  let clientManager: ClientManager;
  let roonSseMessages: RoonSseMessage[];
  let roonSseMessageSubject: Subject<RoonSseMessage>;
  let client_id_counter: number;
  beforeEach(() => {
    jest.isolateModules((): void => {
      void import("./client-manager")
        .then((module) => {
          clientManager = module.clientManager;
        })
        .catch((err: unknown) => {
          logger.error(err);
        });
    });
    jest.useFakeTimers({
      advanceTimers: false,
    });
    client_id_counter = 0;
    nanoidMock.mockImplementation(() => `${++client_id_counter}`);
    roonSseMessageSubject = new Subject<RoonSseMessage>();
    zoneManagerMock.start.mockImplementation(() => Promise.resolve());
    zoneManagerMock.stop.mockImplementation(() => {});
    zoneManagerMock.zones.mockImplementation(() => ZONE_DESCRIPTIONS);
    zoneManagerMock.events.mockImplementation(() => roonSseMessageSubject);
    zoneManagerMock.isStarted.mockImplementation(() => true);
    roonSseMessages = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.resetModules();
    jest.useRealTimers();
  });

  it("clientManager#start should return the Promise returned by zoneManager#start", () => {
    const zoneManagerStartPromise = new Promise<void>(() => {});
    zoneManagerMock.start.mockImplementation(() => zoneManagerStartPromise);
    const startPromise = clientManager.start();
    expect(startPromise).toBe(zoneManagerStartPromise);
  });

  it("clientManager#start should call zoneManager#start only on its first call", async () => {
    await clientManager.start();
    expect(zoneManagerMock.start).toHaveBeenCalledTimes(1);
    await clientManager.start();
    expect(zoneManagerMock.start).toHaveBeenCalledTimes(1);
  });

  it("clientManager#register should throw an Error if called before clientManager#start", () => {
    expect(clientManager.register).toThrow(NOT_STARTED_ERROR);
  });

  it("clientManager#register should return a client_id, generated via 'nanoid', mandatory for all the other calls", async () => {
    await clientManager.start();
    const client_id = clientManager.register();
    expect(client_id).toEqual(`${client_id_counter}`);
  });

  it("clientManager#get should throw an Error if called before clientManager#start", () => {
    expect(clientManager.get).toThrow(NOT_STARTED_ERROR);
  });

  it("clientManager#get should throw an Error if called with a client_id not previously registered", async () => {
    const unregistered_client_id = "unregistered_client_id";
    await clientManager.start();
    expect(() => clientManager.get(unregistered_client_id)).toThrow(
      new Error(`'${unregistered_client_id}' is not a registered client_id`)
    );
  });

  it("clientManager#get should return a Client when called with its registered client_id", async () => {
    await clientManager.start();
    const first_client_id = clientManager.register();
    const first_client = clientManager.get(first_client_id);
    expect(first_client.events).toBeInstanceOf(Function);
    expect(first_client.close).toBeInstanceOf(Function);
    const second_client_id = clientManager.register();
    const second_client = clientManager.get(second_client_id);
    expect(second_client.events).toBeInstanceOf(Function);
    expect(second_client.close).toBeInstanceOf(Function);
  });

  it("clientManager#get should return the same Client instance if called with the same registered client_id", async () => {
    await clientManager.start();
    const client_id = clientManager.register();
    const first_client = clientManager.get(client_id);
    const second_client = clientManager.get(client_id);
    expect(first_client).toBe(second_client);
  });

  it("clientManager#unregister should throw an Error if called before clientManager#start", () => {
    expect(clientManager.unregister).toThrow(NOT_STARTED_ERROR);
  });

  it("clientManager#unregister should call the associated Client#close and delete the instance", async () => {
    await clientManager.start();
    const client_id = clientManager.register();
    const client = clientManager.get(client_id);
    const closeSpy = jest.spyOn(client, "close");
    clientManager.unregister(client_id);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(() => clientManager.get(client_id)).toThrow(new Error(`'${client_id}' is not a registered client_id`));
  });

  it("clientManager#unregister should ignore silently unregistered client_id", async () => {
    await clientManager.start();
    clientManager.unregister("unregistered_client_id");
  });

  it("clientManager#stop, on a started clientManager should call zoneManager#stop, then unregister each registered client", async () => {
    await clientManager.start();
    const first_client_id = clientManager.register();
    const second_client_id = clientManager.register();
    const unregisterSpy = jest.spyOn(clientManager, "unregister");
    clientManager.stop();
    expect(zoneManagerMock.stop).toHaveBeenCalledTimes(1);
    expect(unregisterSpy).toHaveBeenCalledTimes(2);
    expect(unregisterSpy).toHaveBeenNthCalledWith(1, first_client_id);
    expect(unregisterSpy).toHaveBeenNthCalledWith(2, second_client_id);
  });

  it("clientManager#stop, should be silently ignored if clientManager is not started", () => {
    clientManager.stop();
    expect(zoneManagerMock.stop).toHaveBeenCalledTimes(0);
  });

  it("clientManager#stop, let the clientManager as not started", async () => {
    await clientManager.start();
    clientManager.stop();
    expect(clientManager.register).toThrow(NOT_STARTED_ERROR);
  });

  it(
    "Client#events return an Observable<RoonSseMessage> with a merge of zoneManager#events, " +
      "its internal Subject<CommandNotification> and its internal Ping generator",
    async () => {
      await clientManager.start();
      const client_id = clientManager.register();
      const client = clientManager.get(client_id);
      const events = client.events();
      events.subscribe((message) => {
        roonSseMessages.push(message);
      });
      expect(zoneManagerMock.events).toHaveBeenCalledTimes(1);
      // this is not the cleanest way to test it... but it does the job 🤷
      let commandChannel: Subject<CommandState> | undefined = undefined;
      commandDispatcherMock.dispatch.mockImplementation(
        (command: Command, commandNotification: Subject<CommandState>): string => {
          commandChannel = commandNotification;
          return "done";
        }
      );
      roonSseMessageSubject.next({
        event: "state",
        data: {
          state: RoonState.SYNC,
          zones: [],
          outputs: [],
        },
      });
      client.command({} as unknown as Command);
      expect(commandChannel).not.toBeUndefined();
      (commandChannel as unknown as Subject<CommandState>).next({
        state: CommandResult.APPLIED,
        command_id: "command_id",
      });
      expect(roonSseMessages).toHaveLength(2);
      expect(roonSseMessages).toEqual([
        {
          event: "state",
          data: {
            state: RoonState.SYNC,
            zones: [],
            outputs: [],
          },
        },
        {
          event: "command_state",
          data: {
            command_id: "command_id",
            state: CommandResult.APPLIED,
          },
        },
      ]);
      jest.advanceTimersByTime(46000);
      expect(roonSseMessages).toHaveLength(3);
      expect(roonSseMessages[2]).toEqual({
        event: "ping",
        data: {
          next: 45,
        },
      });
    }
  );

  it("Client#close should call roon#browse to clean browse state and remove client instance of clientManager", async () => {
    await clientManager.start();
    const client_id = clientManager.register();
    const client = clientManager.get(client_id);
    client.close();
    expect(roonMock.browse).toHaveBeenCalledTimes(7);
    expect(roonMock.browse).toHaveBeenNthCalledWith(1, {
      multi_session_key: client_id,
      hierarchy: "albums",
      pop_all: true,
      set_display_offset: true,
    });
    expect(roonMock.browse).toHaveBeenNthCalledWith(2, {
      multi_session_key: client_id,
      hierarchy: "artists",
      pop_all: true,
      set_display_offset: true,
    });
    expect(roonMock.browse).toHaveBeenNthCalledWith(3, {
      multi_session_key: client_id,
      hierarchy: "browse",
      pop_all: true,
      set_display_offset: true,
    });
    expect(roonMock.browse).toHaveBeenNthCalledWith(4, {
      multi_session_key: client_id,
      hierarchy: "composers",
      pop_all: true,
      set_display_offset: true,
    });
    expect(roonMock.browse).toHaveBeenNthCalledWith(5, {
      multi_session_key: client_id,
      hierarchy: "genres",
      pop_all: true,
      set_display_offset: true,
    });
    expect(roonMock.browse).toHaveBeenNthCalledWith(6, {
      multi_session_key: client_id,
      hierarchy: "internet_radio",
      pop_all: true,
      set_display_offset: true,
    });
    expect(roonMock.browse).toHaveBeenNthCalledWith(7, {
      multi_session_key: client_id,
      hierarchy: "playlists",
      pop_all: true,
      set_display_offset: true,
    });
    expect(() => clientManager.get(client_id)).toThrow(new Error(`'${client_id}' is not a registered client_id`));
  });

  it("Client#close should call roon#browse to clean browse state, silently logging any error, and remove client instance of clientManager", async () => {
    await clientManager.start();
    const client_id = clientManager.register();
    const client = clientManager.get(client_id);
    roonMock.browse.mockImplementation(() => Promise.reject(new Error("network error")));
    client.close();
    expect(roonMock.browse).toHaveBeenCalledTimes(7);
    expect(() => clientManager.get(client_id)).toThrow(new Error(`'${client_id}' is not a registered client_id`));
  });

  it("Client#command should return the 'command_id' returned by commandDispatcher#disaptch", async () => {
    const command_id = "command_id";
    const command: Command = {} as unknown as Command;
    commandDispatcherMock.dispatch.mockImplementation(() => command_id);
    await clientManager.start();
    const client_id = clientManager.register();
    const client = clientManager.get(client_id);
    const result = client.command(command);
    expect(result).toBe(command_id);
    expect(commandDispatcherMock.dispatch).toHaveBeenCalledTimes(1);
    expect(commandDispatcherMock.dispatch).toHaveBeenCalledWith(command, expect.anything());
  });

  it("Client#browse should call roon#browse and return the returned Promise", async () => {
    await clientManager.start();
    const client_id = clientManager.register();
    const client = clientManager.get(client_id);
    const options: RoonApiBrowseOptions = {} as unknown as RoonApiBrowseOptions;
    const browseResponse: RoonApiBrowseResponse = {} as unknown as RoonApiBrowseResponse;
    roonMock.browse.mockImplementation(() => Promise.resolve(browseResponse));
    const result = client.browse(options);
    void expect(result).resolves.toBe(browseResponse);
    expect(roonMock.browse).toHaveBeenCalledWith(options);
    expect(options.multi_session_key).toEqual(client_id);
    const error = new Error("error");
    roonMock.browse.mockImplementation(() => Promise.reject(error));
    const errorResult = client.browse({} as unknown as RoonApiBrowseOptions);
    void expect(errorResult).rejects.toBe(error);
    expect(roonMock.browse).toHaveBeenCalledWith(options);
  });

  it("Client#load should call roon#load and return the returned Promise", async () => {
    await clientManager.start();
    const client_id = clientManager.register();
    const client = clientManager.get(client_id);
    const options: RoonApiBrowseLoadOptions = {} as unknown as RoonApiBrowseLoadOptions;
    const loadResponse: RoonApiBrowseLoadResponse = {} as unknown as RoonApiBrowseLoadResponse;
    roonMock.load.mockImplementation(() => Promise.resolve(loadResponse));
    const result = client.load(options);
    void expect(result).resolves.toBe(loadResponse);
    expect(roonMock.load).toHaveBeenCalledWith(options);
    expect(options.multi_session_key).toEqual(client_id);
    const error = new Error("error");
    roonMock.load.mockImplementation(() => Promise.reject(error));
    const errorResult = client.load({} as unknown as RoonApiBrowseLoadOptions);
    void expect(errorResult).rejects.toBe(error);
    expect(roonMock.load).toHaveBeenCalledWith(options);
  });
});

const NOT_STARTED_ERROR = new Error("clientManager is not started");

const ZONE_DESCRIPTIONS: ZoneDescription[] = [
  {
    zone_id: "zone_id",
    display_name: "display_name",
  },
];
