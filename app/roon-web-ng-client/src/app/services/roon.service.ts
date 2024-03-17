import { deepEqual } from "fast-equals";
import { DeviceDetectorService } from "ngx-device-detector";
import { Observable, Subscription } from "rxjs";
import { computed, Injectable, OnDestroy, Signal, signal, WritableSignal } from "@angular/core";
import {
  ApiState,
  ClientRoonApiBrowseLoadOptions,
  ClientRoonApiBrowseOptions,
  ClientState,
  Command,
  CommandState,
  QueueState,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseResponse,
  RoonState,
  ZoneState,
} from "@model";
import {
  ApiResultCallback,
  BrowseApiResult,
  BrowseWorkerApiRequest,
  CommandApiResult,
  CommandCallback,
  CommandWorkerApiRequest,
  ExploreWorkerApiRequest,
  LibraryWorkerApiRequest,
  LoadApiResult,
  LoadWorkerApiRequest,
  NavigateWorkerApiRequest,
  OutputCallback,
  PreviousWorkerApiRequest,
  RawApiResult,
  RawWorkerApiRequest,
  RawWorkerEvent,
  VersionApiResult,
  VersionWorkerApiRequest,
  VisibilityState,
  WorkerClientActionMessage,
} from "@model/client";
import { VisibilityService } from "@services/visibility.service";
import { buildRoonWorker } from "@services/worker.utils";

@Injectable({
  providedIn: "root",
})
export class RoonService implements OnDestroy {
  private static readonly THIS_IS_A_BUG_ERROR_MSG = "this is a bug!";

  private readonly _deviceDetectorService: DeviceDetectorService;
  private readonly _$roonState: WritableSignal<ApiState>;
  private readonly _$isGrouping: WritableSignal<boolean>;
  private readonly _commandCallbacks: Map<string, CommandCallback>;
  private readonly _zoneStates: Map<
    string,
    {
      $zone?: WritableSignal<ZoneState>;
      $queue?: WritableSignal<QueueState>;
    }
  >;
  private readonly _visibilitySubscription: Subscription;
  private readonly _apiStringCallbacks: Map<number, ApiResultCallback<string>>;
  private readonly _apiBrowseCallbacks: Map<number, ApiResultCallback<RoonApiBrowseResponse>>;
  private readonly _apiLoadCallbacks: Map<number, ApiResultCallback<RoonApiBrowseLoadResponse>>;
  private _workerApiRequestId: number;
  private _isStarted: boolean;
  private _outputCallback?: OutputCallback;
  private _worker?: Worker;
  private _version: string;
  private _startResolve?: () => void;
  private _startReject?: (err: Error) => void;

  constructor(deviceDetectorService: DeviceDetectorService, visibilityService: VisibilityService) {
    this._deviceDetectorService = deviceDetectorService;
    this._$roonState = signal(
      {
        state: RoonState.STARTING,
        zones: [],
        outputs: [],
      },
      {
        equal: deepEqual,
      }
    );
    this._$isGrouping = signal(false);
    this._commandCallbacks = new Map<string, CommandCallback>();
    this._zoneStates = new Map<
      string,
      {
        $zone?: WritableSignal<ZoneState>;
        $queue?: WritableSignal<QueueState>;
      }
    >();
    this._isStarted = false;
    this._visibilitySubscription = visibilityService.observeVisibility((visibilityState) => {
      if (visibilityState === VisibilityState.VISIBLE) {
        this.refresh();
      }
    });
    this._apiStringCallbacks = new Map<number, ApiResultCallback<string>>();
    this._apiBrowseCallbacks = new Map<number, ApiResultCallback<RoonApiBrowseResponse>>();
    this._apiLoadCallbacks = new Map<number, ApiResultCallback<RoonApiBrowseLoadResponse>>();
    this._workerApiRequestId = 0;
    this._version = "unknown";
  }

  start: () => Promise<void> = async () => {
    const startPromise = new Promise<void>((resolve, reject) => {
      this._startResolve = resolve;
      this._startReject = reject;
    });
    this._worker = buildRoonWorker();
    this._worker.onmessage = (m: MessageEvent<RawWorkerEvent>) => {
      this.dispatchWorkerEvent(m);
    };
    const isDesktop = this._deviceDetectorService.isDesktop() && !this._deviceDetectorService.isTablet();
    const startMessage: WorkerClientActionMessage = {
      event: "worker-client",
      data: {
        action: "start-client",
        url: window.location.href,
        isDesktop,
      },
    };
    this._worker.postMessage(startMessage);
    try {
      await startPromise;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("error during app startup");
      throw err;
    }
    const id = this.nextWorkerApiRequestId();
    const apiRequest: VersionWorkerApiRequest = {
      id,
      type: "version",
      data: undefined,
    };
    const apiResultCallback: ApiResultCallback<string> = {
      next: (versionApiResult) => {
        this._version = versionApiResult;
      },
    };
    this._apiStringCallbacks.set(id, apiResultCallback);
    this._worker.postMessage({
      event: "worker-api",
      data: apiRequest,
    });
  };

  roonState: () => Signal<ApiState> = () => {
    return this._$roonState;
  };

  zoneState: ($zoneId: Signal<string>) => Signal<ZoneState> = ($zoneId: Signal<string>) => {
    this.ensureStarted();
    return computed(() => {
      const zs = this._zoneStates.get($zoneId());
      if (zs?.$zone) {
        return zs.$zone();
      } else {
        // FIXME: this is very dangerous (possible memoization of an Error)
        // find a better to handle this (especially because it should never happen)
        throw new Error(RoonService.THIS_IS_A_BUG_ERROR_MSG);
      }
    });
  };

  queueState: ($zoneId: Signal<string>) => Signal<QueueState> = ($zoneId: Signal<string>) => {
    this.ensureStarted();
    return computed(() => {
      const zs = this._zoneStates.get($zoneId());
      if (zs?.$queue) {
        return zs.$queue();
      } else {
        // FIXME: this is very dangerous (possible memoization of an Error)
        // find a better to handle this (especially because it should never happen)
        throw new Error(RoonService.THIS_IS_A_BUG_ERROR_MSG);
      }
    });
  };

  command: (command: Command, commandCallback?: CommandCallback) => void = (
    command: Command,
    commandCallback?: CommandCallback
  ) => {
    const worker = this.ensureStarted();
    const id = this.nextWorkerApiRequestId();
    const apiRequest: CommandWorkerApiRequest = {
      type: "command",
      id,
      data: command,
    };
    if (commandCallback) {
      const apiResultCallback: ApiResultCallback<string> = {
        next: (command_id: string) => {
          this._commandCallbacks.set(command_id, commandCallback);
        },
      };
      this._apiStringCallbacks.set(id, apiResultCallback);
    }
    worker.postMessage({
      event: "worker-api",
      data: apiRequest,
    });
  };

  library: (zone_id: string) => Observable<RoonApiBrowseLoadResponse> = (zone_id: string) => {
    const worker = this.ensureStarted();
    const id = this.nextWorkerApiRequestId();
    const apiRequest: LibraryWorkerApiRequest = {
      id,
      type: "library",
      data: zone_id,
    };
    return this.buildLoadResponseObservable(worker, apiRequest);
  };

  explore: (zone_id: string) => Observable<RoonApiBrowseLoadResponse> = (zone_id: string) => {
    const worker = this.ensureStarted();
    const apiRequest: ExploreWorkerApiRequest = {
      id: this.nextWorkerApiRequestId(),
      type: "explore",
      data: zone_id,
    };
    return this.buildLoadResponseObservable(worker, apiRequest);
  };

  previous: (zone_id: string, levels?: number) => Observable<RoonApiBrowseLoadResponse> = (
    zone_id: string,
    levels?: number
  ) => {
    const worker = this.ensureStarted();
    const apiRequest: PreviousWorkerApiRequest = {
      id: this.nextWorkerApiRequestId(),
      type: "previous",
      data: {
        levels,
        zone_id,
      },
    };
    return this.buildLoadResponseObservable(worker, apiRequest);
  };

  navigate: (zone_id: string, item_key?: string, input?: string) => Observable<RoonApiBrowseLoadResponse> = (
    zone_id: string,
    item_key?: string,
    input?: string
  ) => {
    const worker = this.ensureStarted();
    const apiRequest: NavigateWorkerApiRequest = {
      id: this.nextWorkerApiRequestId(),
      type: "navigate",
      data: {
        item_key,
        zone_id,
        input,
      },
    };
    return this.buildLoadResponseObservable(worker, apiRequest);
  };

  browse: (options: ClientRoonApiBrowseOptions) => Promise<RoonApiBrowseResponse> = (options) => {
    const worker = this.ensureStarted();
    const id = this.nextWorkerApiRequestId();
    const apiRequest: BrowseWorkerApiRequest = {
      id,
      type: "browse",
      data: options,
    };
    return new Promise((resolve, reject) => {
      const apiResultCallback: ApiResultCallback<RoonApiBrowseResponse> = {
        next: (browseApiResult) => {
          resolve(browseApiResult);
        },
        error: (error) => {
          reject(error);
        },
      };
      this._apiBrowseCallbacks.set(id, apiResultCallback);
      worker.postMessage({
        event: "worker-api",
        data: apiRequest,
      });
    });
  };

  load: (options: ClientRoonApiBrowseLoadOptions) => Promise<RoonApiBrowseLoadResponse> = (options) => {
    const worker = this.ensureStarted();
    const id = this.nextWorkerApiRequestId();
    const apiRequest: LoadWorkerApiRequest = {
      id,
      type: "load",
      data: options,
    };
    return new Promise((resolve, reject) => {
      const apiResultCallback: ApiResultCallback<RoonApiBrowseLoadResponse> = {
        next: (browseApiResult) => {
          resolve(browseApiResult);
        },
        error: (error) => {
          reject(error);
        },
      };
      this._apiLoadCallbacks.set(id, apiResultCallback);
      worker.postMessage({
        event: "worker-api",
        data: apiRequest,
      });
    });
  };

  version: () => string = () => {
    return this._version;
  };

  registerOutputCallback: (callback: OutputCallback) => void = (callback: OutputCallback) => {
    this._outputCallback = callback;
  };

  ngOnDestroy() {
    this._visibilitySubscription.unsubscribe();
  }

  startGrouping() {
    this._$isGrouping.set(true);
  }

  endGrouping() {
    this._$isGrouping.set(false);
  }

  isGrouping(): Signal<boolean> {
    return this._$isGrouping;
  }

  private reconnect: () => void = () => {
    if (this._worker) {
      const message: WorkerClientActionMessage = {
        event: "worker-client",
        data: {
          action: "restart-client",
        },
      };
      this._worker.postMessage(message);
    }
  };

  private refresh: () => void = () => {
    if (this._worker) {
      const message: WorkerClientActionMessage = {
        event: "worker-client",
        data: {
          action: "refresh-client",
        },
      };
      this._worker.postMessage(message);
    }
  };

  private ensureStarted(): Worker {
    if (!this._isStarted || !this._worker) {
      throw new Error("you must wait for RoonService#start to complete before calling any other methods");
    }
    return this._worker;
  }

  private dispatchWorkerEvent(m: MessageEvent<RawWorkerEvent>) {
    switch (m.data.event) {
      case "state":
        this.onRoonState(m.data.data);
        break;
      case "zone":
        this.onZoneState(m.data.data);
        break;
      case "queue":
        this.onQueueState(m.data.data);
        break;
      case "command":
        this.onCommandState(m.data.data);
        break;
      case "clientState":
        this.onClientState(m.data.data);
        break;
      case "apiResult":
        this.onApiResult(m.data.data);
        break;
    }
  }

  private onRoonState(state: ApiState) {
    this._$roonState.set(state);
    if (state.state === RoonState.SYNC) {
      if (this._outputCallback) {
        this._outputCallback(state.outputs);
        delete this._outputCallback;
      }
    } else if (state.state === RoonState.STOPPED) {
      this.reconnect();
    }
  }

  private onZoneState(state: ZoneState) {
    const zs = this._zoneStates.get(state.zone_id);
    if (zs) {
      if (zs.$zone) {
        zs.$zone.set(state);
      } else {
        zs.$zone = signal(state);
      }
    } else {
      this._zoneStates.set(state.zone_id, {
        $zone: signal(state),
      });
    }
  }

  private onQueueState(state: QueueState) {
    const zs = this._zoneStates.get(state.zone_id);
    if (zs) {
      if (zs.$queue) {
        zs.$queue.set(state);
      } else {
        zs.$queue = signal(state);
      }
    } else {
      this._zoneStates.set(state.zone_id, {
        $queue: signal(state),
      });
    }
  }

  private onCommandState(notification: CommandState) {
    const commandCallback = this._commandCallbacks.get(notification.command_id);
    if (commandCallback) {
      this._commandCallbacks.delete(notification.command_id);
      commandCallback(notification);
    }
  }

  private onClientState(clientState: ClientState) {
    switch (clientState) {
      case "outdated":
        window.location.reload();
        break;
      case "started":
        if (this._startResolve) {
          this._isStarted = true;
          this._startResolve();
          delete this._startResolve;
          delete this._startReject;
        }
        break;
      case "not-started":
        if (this._startReject) {
          this._isStarted = false;
          this._startReject(new Error());
          delete this._startResolve;
          delete this._startReject;
        }
        break;
    }
  }

  private onApiResult(apiResultEvent: RawApiResult) {
    switch (apiResultEvent.type) {
      case "browse":
        this.onBrowseApiResult(apiResultEvent);
        break;
      case "command":
        this.onStringApiResult(apiResultEvent);
        break;
      case "load":
        this.onLoadApiResult(apiResultEvent);
        break;
      case "version":
        this.onStringApiResult(apiResultEvent);
        break;
    }
  }

  private onBrowseApiResult(apiResult: BrowseApiResult) {
    const callback = this._apiBrowseCallbacks.get(apiResult.id);
    if (callback) {
      if (apiResult.data) {
        callback.next(apiResult.data);
      } else if (apiResult.error && callback.error) {
        callback.error(apiResult.error);
      }
      this._apiBrowseCallbacks.delete(apiResult.id);
    }
  }

  private onLoadApiResult(apiResult: LoadApiResult) {
    const callback = this._apiLoadCallbacks.get(apiResult.id);
    if (callback) {
      if (apiResult.data) {
        callback.next(apiResult.data);
      } else if (apiResult.error && callback.error) {
        callback.error(apiResult.error);
      }
      this._apiLoadCallbacks.delete(apiResult.id);
    }
  }

  private onStringApiResult(apiResult: CommandApiResult | VersionApiResult) {
    const callback = this._apiStringCallbacks.get(apiResult.id);
    if (callback) {
      if (apiResult.data) {
        callback.next(apiResult.data);
      } else if (apiResult.error && callback.error) {
        callback.error(apiResult.error);
      }
      this._apiStringCallbacks.delete(apiResult.id);
    }
  }

  private buildLoadResponseObservable(worker: Worker, apiRequest: RawWorkerApiRequest) {
    return new Observable<RoonApiBrowseLoadResponse>((subscriber) => {
      const apiResultCallback: ApiResultCallback<RoonApiBrowseLoadResponse> = {
        next: (loadResponse) => {
          subscriber.next(loadResponse);
          subscriber.complete();
        },
        error: (error) => {
          subscriber.error(error);
          subscriber.complete();
        },
      };
      this._apiLoadCallbacks.set(apiRequest.id, apiResultCallback);
      worker.postMessage({
        event: "worker-api",
        data: apiRequest,
      });
    });
  }

  private nextWorkerApiRequestId() {
    return this._workerApiRequestId++;
  }
}
