import {
  ApiState,
  ClientRoonApiBrowseLoadOptions,
  ClientRoonApiBrowseOptions,
  ClientState,
  ClientStateListener,
  Command,
  CommandState,
  CommandStateListener,
  Ping,
  QueueState,
  QueueStateListener,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseResponse,
  RoonState,
  RoonStateListener,
  RoonWebClient,
  RoonWebClientFactory,
  ZoneState,
  ZoneStateListener,
} from "@model";

interface ZoneStates {
  zone?: ZoneState;
  queue?: QueueState;
}

class InternalRoonWebClient implements RoonWebClient {
  private static readonly X_ROON_WEB_STACK_VERSION_HEADER = "x-roon-web-stack-version";
  private static readonly CLIENT_NOT_STARTED_ERROR_MESSAGE = "client has not been started";
  private _eventSource?: EventSource;
  private _apiState?: ApiState;
  private readonly _zones: Map<string, ZoneStates>;
  private readonly _roonStateListeners: RoonStateListener[];
  private readonly _commandStateListeners: CommandStateListener[];
  private readonly _zoneStateListeners: ZoneStateListener[];
  private readonly _queueStateListeners: QueueStateListener[];
  private readonly _clientStateListeners: ClientStateListener[];
  private readonly _apiHost: URL;
  private _abortController?: AbortController;
  private _roonWebStackVersion?: string;
  private _clientPath?: string;
  private _isClosed: boolean;
  private _mustRefresh: boolean;
  private _libraryItemKey?: string;
  private _pingInterval?: ReturnType<typeof setTimeout>;

  constructor(apiHost: URL) {
    this._apiHost = apiHost;
    this._zones = new Map<string, ZoneStates>();
    this._roonStateListeners = [];
    this._commandStateListeners = [];
    this._zoneStateListeners = [];
    this._queueStateListeners = [];
    this._clientStateListeners = [];
    this._isClosed = true;
    this._mustRefresh = false;
  }

  start: () => Promise<void> = async () => {
    if (this._isClosed) {
      this._abortController = new AbortController();
      const versionUrl = new URL("/api/version", this._apiHost);
      const versionReq = new Request(versionUrl, {
        method: "GET",
        mode: "cors",
        signal: this._abortController.signal,
      });
      const versionResponse = await fetch(versionReq);
      const version = versionResponse.headers.get(InternalRoonWebClient.X_ROON_WEB_STACK_VERSION_HEADER);
      if (versionResponse.status === 204 && version) {
        if (this._roonWebStackVersion && this._roonWebStackVersion !== version) {
          this.onClientStateMessage("outdated");
        } else {
          this._roonWebStackVersion = version;
        }
      } else {
        throw new Error("unable to validate roon-web-stack version");
      }
      const registerUrl = new URL("/api/register", this._apiHost);
      const registerReq = new Request(registerUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          Accept: "application/json",
        },
        signal: this._abortController.signal,
      });
      const registerResponse = await fetch(registerReq);
      delete this._abortController;
      if (registerResponse.status === 201) {
        const locationHeader = registerResponse.headers.get("Location");
        if (locationHeader) {
          this._clientPath = locationHeader;
          await this.loadLibraryItemKey();
          this.connectEventSource();
          this._isClosed = false;
          this._mustRefresh = false;
          this.onClientStateMessage("started");
          return;
        }
      }
      throw new Error("unable to register client");
    }
  };

  restart: () => Promise<void> = async () => {
    this.ensureStared();
    this._isClosed = true;
    this._eventSource?.close();
    delete this._eventSource;
    this._abortController?.abort();
    return this.start();
  };

  refresh: () => Promise<void> = async () => {
    if (this._mustRefresh) {
      this._mustRefresh = false;
      try {
        await this.restart();
      } catch (err) {
        this._mustRefresh = true;
        throw err;
      }
    }
  };

  stop: () => Promise<void> = async () => {
    const clientPath = this.ensureStared();
    const unregisterUrl = new URL(`${clientPath}/unregister`, this._apiHost);
    const unregisterRequest = new Request(unregisterUrl, {
      method: "POST",
      mode: "cors",
    });
    const response = await fetch(unregisterRequest);
    if (response.status === 204) {
      this.closeClient();
      return;
    }
    throw new Error("unable to unregister client");
  };

  onRoonState: (listener: RoonStateListener) => void = (listener: RoonStateListener) => {
    if (this._apiState && this._apiState.state !== RoonState.STOPPED) {
      listener(this._apiState);
    } else if (this._apiState === undefined) {
      listener({ state: RoonState.STARTING, zones: [], outputs: [] });
    }
    this._roonStateListeners.push(listener);
  };

  offRoonState: (listener: RoonStateListener) => void = (listener: RoonStateListener) => {
    const listenerIndex = this._roonStateListeners.indexOf(listener);
    if (listenerIndex !== -1) {
      this._roonStateListeners.splice(listenerIndex, 1);
    }
  };

  onCommandState: (listener: CommandStateListener) => void = (listener: CommandStateListener) => {
    this._commandStateListeners.push(listener);
  };

  offCommandState: (listener: CommandStateListener) => void = (listener: CommandStateListener) => {
    const listenerIndex = this._commandStateListeners.indexOf(listener);
    if (listenerIndex !== -1) {
      this._commandStateListeners.splice(listenerIndex, 1);
    }
  };

  onZoneState: (listener: ZoneStateListener) => void = (listener: ZoneStateListener) => {
    for (const zs of this._zones.values()) {
      if (zs.zone) {
        listener(zs.zone);
      }
    }
    this._zoneStateListeners.push(listener);
  };

  offZoneState: (listener: ZoneStateListener) => void = (listener: ZoneStateListener) => {
    const listenerIndex = this._zoneStateListeners.indexOf(listener);
    if (listenerIndex !== -1) {
      this._zoneStateListeners.splice(listenerIndex, 1);
    }
  };

  onQueueState: (listener: QueueStateListener) => void = (listener: QueueStateListener) => {
    for (const zs of this._zones.values()) {
      if (zs.queue) {
        listener(zs.queue);
      }
    }
    this._queueStateListeners.push(listener);
  };

  offQueueState: (listener: QueueStateListener) => void = (listener: QueueStateListener) => {
    const listenerIndex = this._queueStateListeners.indexOf(listener);
    if (listenerIndex !== -1) {
      this._queueStateListeners.splice(listenerIndex, 1);
    }
  };

  onClientState: (listener: ClientStateListener) => void = (listener: ClientStateListener) => {
    this._clientStateListeners.push(listener);
  };

  offClientState: (listener: ClientStateListener) => void = (listener: ClientStateListener) => {
    const listenerIndex = this._clientStateListeners.indexOf(listener);
    if (listenerIndex !== -1) {
      this._clientStateListeners.splice(listenerIndex, 1);
    }
  };

  command: (command: Command) => Promise<string> = async (command: Command): Promise<string> => {
    const clientPath = this.ensureStared();
    const commandUrl = new URL(`${clientPath}/command`, this._apiHost);
    const req = new Request(commandUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    const response = await this.fetchRefreshed(req);
    if (response.status === 202) {
      const json: CommandJsonResponse = (await response.json()) as unknown as CommandJsonResponse;
      return json.command_id;
    }
    throw new Error("unable to send command");
  };

  browse: (options: ClientRoonApiBrowseOptions) => Promise<RoonApiBrowseResponse> = async (
    options: ClientRoonApiBrowseOptions
  ): Promise<RoonApiBrowseResponse> => {
    const clientPath = this.ensureStared();
    const browseUrl = new URL(`${clientPath}/browse`, this._apiHost);
    const req = new Request(browseUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });
    const response = await this.fetchRefreshed(req);
    if (response.status === 200) {
      return (await response.json()) as unknown as RoonApiBrowseResponse;
    } else {
      throw new Error("unable to browse content");
    }
  };

  load: (options: ClientRoonApiBrowseLoadOptions) => Promise<RoonApiBrowseLoadResponse> = async (
    options: ClientRoonApiBrowseLoadOptions
  ): Promise<RoonApiBrowseLoadResponse> => {
    const clientPath = this.ensureStared();
    const loadUrl = new URL(`${clientPath}/load`, this._apiHost);
    const req = new Request(loadUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });
    const response = await this.fetchRefreshed(req);
    if (response.status === 200) {
      return (await response.json()) as unknown as RoonApiBrowseLoadResponse;
    } else {
      throw new Error("unable to load content");
    }
  };

  library: (zone_id: string) => Promise<RoonApiBrowseLoadResponse> = async (zone_id) => {
    this.ensureStared();
    const browseLibraryResponse = await this.browse({
      hierarchy: "browse",
      item_key: this._libraryItemKey,
      zone_or_output_id: zone_id,
    });
    return this.load({
      hierarchy: "browse",
      level: browseLibraryResponse.list?.level,
    });
  };

  version: () => string = () => {
    if (this._roonWebStackVersion) {
      return this._roonWebStackVersion;
    } else {
      throw new Error(InternalRoonWebClient.CLIENT_NOT_STARTED_ERROR_MESSAGE);
    }
  };

  private loadLibraryItemKey: () => Promise<void> = async () => {
    const exploreBrowseResponse = await this.browse({ hierarchy: "browse" });
    const exploreLoadResponse = await this.load({ hierarchy: "browse", level: exploreBrowseResponse.list?.level });
    const libraryItemKey = exploreLoadResponse.items.length ? exploreLoadResponse.items[0].item_key : undefined;
    if (libraryItemKey) {
      this._libraryItemKey = libraryItemKey;
      return Promise.resolve();
    } else {
      return Promise.reject(new Error("can't initialize Library item_key"));
    }
  };

  private ensureStared: () => string = () => {
    if (this._clientPath === undefined) {
      throw new Error(InternalRoonWebClient.CLIENT_NOT_STARTED_ERROR_MESSAGE);
    }
    return this._clientPath;
  };

  private connectEventSource: () => void = (): void => {
    if (this._eventSource === undefined) {
      const clientPath = this.ensureStared();
      const eventSourceUrl = new URL(`${clientPath}/events`, this._apiHost);
      this._eventSource = new EventSource(eventSourceUrl);
      this._eventSource.addEventListener("state", this.onApiStateMessage);
      this._eventSource.addEventListener("command_state", this.onCommandStateMessage);
      this._eventSource.addEventListener("zone", this.onZoneMessage);
      this._eventSource.addEventListener("queue", this.onQueueMessage);
      this._eventSource.addEventListener("ping", this.onPingMessage);
      this._eventSource.onerror = () => {
        this._mustRefresh = true;
      };
    }
  };

  private onApiStateMessage = (m: MessageEvent<string>): void => {
    const apiState: ApiState | undefined = parseJson(m.data);
    if (apiState) {
      this._apiState = apiState;
      for (const roonStateListener of this._roonStateListeners) {
        roonStateListener(apiState);
      }
    }
  };

  private onCommandStateMessage = (m: MessageEvent<string>): void => {
    const commandState: CommandState | undefined = parseJson(m.data);
    if (commandState) {
      for (const commandStateListener of this._commandStateListeners) {
        commandStateListener(commandState);
      }
    }
  };

  private onZoneMessage = (m: MessageEvent<string>): void => {
    const zoneState: ZoneState | undefined = parseJson(m.data);
    if (zoneState) {
      const zoneStates = this._zones.get(zoneState.zone_id);
      if (!zoneStates) {
        this._zones.set(zoneState.zone_id, {
          zone: zoneState,
        });
      } else {
        zoneStates.zone = zoneState;
      }
      for (const zoneStateListener of this._zoneStateListeners) {
        zoneStateListener(zoneState);
      }
    }
  };

  private onQueueMessage = (m: MessageEvent<string>): void => {
    const queueState: QueueState | undefined = parseJson(m.data);
    if (queueState) {
      const zoneStates = this._zones.get(queueState.zone_id);
      if (!zoneStates) {
        this._zones.set(queueState.zone_id, {
          queue: queueState,
        });
      } else {
        zoneStates.queue = queueState;
      }
      for (const queueStateListener of this._queueStateListeners) {
        queueStateListener(queueState);
      }
    }
  };

  private onPingMessage = (m: MessageEvent<string>): void => {
    const ping: Ping | undefined = parseJson(m.data);
    if (ping) {
      if (this._pingInterval) {
        clearTimeout(this._pingInterval);
      }
      this._pingInterval = setTimeout(
        () => {
          delete this._pingInterval;
          this._mustRefresh = true;
        },
        ping.next * 1.5 * 1000
      );
    }
  };

  private onClientStateMessage = (clientState: ClientState): void => {
    for (const clientStateListener of this._clientStateListeners) {
      clientStateListener(clientState);
    }
  };

  private closeClient = (): void => {
    this._eventSource?.close();
    delete this._eventSource;
    delete this._apiState;
    this._zones.clear();
    for (const stateListener of this._roonStateListeners) {
      stateListener({ state: RoonState.STOPPED, zones: [], outputs: [] });
    }
    this._roonStateListeners.splice(0, Infinity);
    this._commandStateListeners.splice(0, Infinity);
    this._zoneStateListeners.splice(0, Infinity);
    this._queueStateListeners.splice(0, Infinity);
    this._isClosed = true;
  };

  private fetchRefreshed = async (req: Request): Promise<Response> => {
    const response = await fetch(req);
    if (response.status === 403) {
      this._mustRefresh = true;
      await this.refresh();
      return this.fetchRefreshed(req);
    } else {
      return response;
    }
  };
}

const build: (apiUrl: URL) => RoonWebClient = (apiUrl: URL) => {
  return new InternalRoonWebClient(apiUrl);
};

export const roonWebClientFactory: RoonWebClientFactory = {
  build,
};

const parseJson = <T>(json: string): T | undefined => {
  try {
    return JSON.parse(json) as unknown as T;
  } catch {
    return undefined;
  }
};

type CommandJsonResponse = { command_id: string };
