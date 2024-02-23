import { nanoid } from "nanoid";
import { map, mergeWith, Observable, Subject } from "rxjs";
import { dataConverter, zoneManager } from "@data";
import { roon } from "@infrastructure";
import {
  Client,
  ClientManager,
  Command,
  CommandState,
  RoonApiBrowseLoadOptions,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseOptions,
  RoonApiBrowseResponse,
  RoonSseMessage,
} from "@model";
import { commandDispatcher } from "@service";

class InternalClient implements Client {
  private readonly client_id: string;
  private readonly commandChannel: Subject<CommandState>;
  private readonly onCloseListener: () => void;
  private eventChannel?: Observable<RoonSseMessage>;

  constructor(client_id: string, onCloseListener: () => void) {
    this.client_id = client_id;
    this.commandChannel = new Subject<CommandState>();
    this.onCloseListener = onCloseListener;
  }

  events = (): Observable<RoonSseMessage> => {
    if (this.eventChannel === undefined) {
      this.eventChannel = this.commandChannel
        .pipe(map(dataConverter.toRoonSseMessage))
        .pipe(mergeWith(zoneManager.events()));
    }
    return this.eventChannel;
  };

  close = (): void => {
    this.onCloseListener();
  };

  command = (command: Command): string => {
    return commandDispatcher.dispatch(command, this.commandChannel);
  };

  browse = async (options: RoonApiBrowseOptions): Promise<RoonApiBrowseResponse> => {
    options.multi_session_key = this.client_id;
    return roon.browse(options);
  };

  load = async (options: RoonApiBrowseLoadOptions): Promise<RoonApiBrowseLoadResponse> => {
    options.multi_session_key = this.client_id;
    return roon.load(options);
  };
}

const generateClientId = (): string => {
  return nanoid();
};

class InternalClientManager implements ClientManager {
  private readonly clients: Map<string, Client>;
  private isStarted: boolean;

  constructor() {
    this.clients = new Map<string, Client>();
    this.isStarted = false;
  }

  register = (): string => {
    this.ensureStarted();
    const client_id = generateClientId();
    const client = new InternalClient(client_id, () => {
      this.clients.delete(client_id);
    });
    this.clients.set(client_id, client);
    return client_id;
  };

  get = (client_id: string): Client => {
    this.ensureStarted();
    const client = this.clients.get(client_id);
    if (!client) {
      throw new Error(`'${client_id}' is not a registered client_id`);
    }
    return client;
  };

  unregister = (client_id: string): void => {
    this.ensureStarted();
    const client = this.clients.get(client_id);
    client?.close();
  };

  start = (): Promise<void> => {
    if (!this.isStarted) {
      this.isStarted = true;
      return zoneManager.start();
    } else {
      return Promise.resolve();
    }
  };

  stop = (): void => {
    if (this.isStarted) {
      for (const client_id of this.clients.keys()) {
        this.unregister(client_id);
      }
      zoneManager.stop();
      this.isStarted = false;
    }
  };

  private ensureStarted = (): void => {
    if (!this.isStarted || !zoneManager.isStarted()) {
      throw new Error("clientManager is not started");
    }
  };
}

export const clientManager: ClientManager = new InternalClientManager();
