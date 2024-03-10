import { deepEqual } from "fast-equals";
import { defer, from, Observable, retry, Subscription, timer } from "rxjs";
import { computed, Injectable, OnDestroy, Signal, signal, WritableSignal } from "@angular/core";
import {
  ApiState,
  ClientRoonApiBrowseLoadOptions,
  ClientRoonApiBrowseOptions,
  Command,
  CommandState,
  CommandStateListener,
  QueueState,
  QueueStateListener,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseResponse,
  RoonState,
  RoonStateListener,
  RoonWebClient,
  ZoneState,
  ZoneStateListener,
} from "@model";
import { CommandCallback, OutputCallback, VisibilityState } from "@model/client";
import { roonWebClientFactory, UPDATE_NEEDED_ERROR_MESSAGE } from "@nihilux/roon-web-client";
import { VisibilityService } from "@services/visibility.service";

@Injectable({
  providedIn: "root",
})
export class RoonService implements OnDestroy {
  private static readonly THIS_IS_A_BUG_ERROR_MSG = "this is a bug!";

  private readonly _roonClient: RoonWebClient;
  private readonly _roonStateListener: RoonStateListener;
  private readonly _$roonState: WritableSignal<ApiState>;
  private readonly _$isGrouping: WritableSignal<boolean>;
  private readonly _commandStateListener: CommandStateListener;
  private readonly _commandCallbacks: Map<string, CommandCallback>;
  private readonly _outputCallbacks: Map<string, OutputCallback>;
  private readonly _zoneStateListener: ZoneStateListener;
  private readonly _zoneStates: Map<
    string,
    {
      $zone?: WritableSignal<ZoneState>;
      $queue?: WritableSignal<QueueState>;
    }
  >;
  private readonly _queueStateListener: QueueStateListener;
  private readonly _visibilitySubscription: Subscription;
  private _isStarted: boolean;
  private _isRefreshing: boolean;

  constructor(visibilityService: VisibilityService) {
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
    this._roonClient = roonWebClientFactory.build(new URL(window.location.href));
    this._roonStateListener = (state: ApiState): void => {
      this._$roonState.set(state);
      if (state.state === RoonState.SYNC) {
        for (const [output_id, oc] of this._outputCallbacks) {
          const zone_id = state.outputs.find((o) => o.output_id === output_id)?.zone_id;
          if (zone_id) {
            oc(output_id, zone_id);
            this._outputCallbacks.delete(output_id);
          }
        }
      } else if (state.state === RoonState.STOPPED) {
        this.reconnect();
      }
    };
    this._commandCallbacks = new Map<string, CommandCallback>();
    this._outputCallbacks = new Map<string, OutputCallback>();
    this._commandStateListener = (notification: CommandState): void => {
      const commandCallback = this._commandCallbacks.get(notification.command_id);
      if (commandCallback) {
        this._commandCallbacks.delete(notification.command_id);
        commandCallback(notification);
      }
    };
    this._zoneStates = new Map<
      string,
      {
        $zone?: WritableSignal<ZoneState>;
        $queue?: WritableSignal<QueueState>;
      }
    >();
    this._zoneStateListener = (state: ZoneState): void => {
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
    };
    this._queueStateListener = (state: QueueState): void => {
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
    };
    this._isStarted = false;
    this._isRefreshing = false;
    this._visibilitySubscription = visibilityService.observeVisibility((visibilityState) => {
      if (this._isStarted && visibilityState === VisibilityState.VISIBLE && !this._isRefreshing) {
        this._isRefreshing = true;
        const refreshSub = defer(() => this._roonClient.refresh())
          .pipe(
            retry({
              // FIXME?: 2 should be good... it's a pain to test on mobile, let's keep 5 to be sure?
              count: 5,
            })
          )
          .subscribe({
            next: () => {
              this._isRefreshing = false;
              refreshSub.unsubscribe();
            },
            // FIXME?: if refresh breaks, isn't reloading everything a little extreme?
            error: () => {
              refreshSub.unsubscribe();
              window.location.reload();
            },
          });
      }
    });
  }

  start: () => Promise<void> = async () => {
    this._roonClient.onRoonState(this._roonStateListener);
    this._roonClient.onCommandState(this._commandStateListener);
    this._roonClient.onZoneState(this._zoneStateListener);
    this._roonClient.onQueueState(this._queueStateListener);
    return this._roonClient
      .start()
      .then(() => {
        this._isStarted = true;
      })
      .catch((err) => {
        if (err instanceof Error && err.message === UPDATE_NEEDED_ERROR_MESSAGE) {
          window.location.reload();
        } else {
          // eslint-disable-next-line no-console
          console.error("startup-error", err);
        }
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
    this.ensureStarted();
    this._roonClient
      .command(command)
      .then((commandId) => {
        if (commandCallback) {
          this._commandCallbacks.set(commandId, commandCallback);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  };

  library: (zone_id: string) => Observable<RoonApiBrowseLoadResponse> = (zone_id: string) => {
    this.ensureStarted();
    return from(this._roonClient.library(zone_id));
  };

  explore: (zone_id: string) => Observable<RoonApiBrowseLoadResponse> = (zone_id: string) => {
    this.ensureStarted();
    return from(
      this._roonClient
        .browse({
          hierarchy: "browse",
          zone_or_output_id: zone_id,
        })
        .then(() => {
          return this._roonClient.load({
            hierarchy: "browse",
            level: 0,
          });
        })
    );
  };

  previous: (zone_id: string, levels?: number) => Observable<RoonApiBrowseLoadResponse> = (
    zone_id: string,
    levels?: number
  ) => {
    this.ensureStarted();
    return from(
      this._roonClient
        .browse({
          hierarchy: "browse",
          pop_levels: levels ?? 1,
          zone_or_output_id: zone_id,
        })
        .then((previousBrowseResponse) => {
          return this._roonClient.load({
            hierarchy: "browse",
            level: previousBrowseResponse.list?.level,
          });
        })
    );
  };

  navigate: (zone_id: string, item_key?: string, input?: string) => Observable<RoonApiBrowseLoadResponse> = (
    zone_id: string,
    item_key?: string,
    input?: string
  ) => {
    this.ensureStarted();
    return from(
      this._roonClient
        .browse({
          hierarchy: "browse",
          item_key,
          input,
          zone_or_output_id: zone_id,
        })
        .then((browseResponse) => {
          return this._roonClient.load({
            hierarchy: "browse",
            level: browseResponse.list?.level,
          });
        })
    );
  };

  browse: (options: ClientRoonApiBrowseOptions) => Promise<RoonApiBrowseResponse> = (options) => {
    this.ensureStarted();
    return this._roonClient.browse(options);
  };

  load: (options: ClientRoonApiBrowseLoadOptions) => Promise<RoonApiBrowseLoadResponse> = (options) => {
    this.ensureStarted();
    return this._roonClient.load(options);
  };

  version: () => string = () => {
    this.ensureStarted();
    return this._roonClient.version();
  };

  registerOutputCallback: (output_id: string, callback: OutputCallback) => void = (
    output_id: string,
    callback: OutputCallback
  ) => {
    this._outputCallbacks.set(output_id, callback);
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
    const retrySub = defer(() => this._roonClient.restart())
      .pipe(
        retry({
          delay: (err) => {
            if (err instanceof Error && err.message === UPDATE_NEEDED_ERROR_MESSAGE) {
              window.location.reload();
            }
            return timer(5000);
          },
        })
      )
      .subscribe(() => {
        retrySub.unsubscribe();
      });
  };

  private ensureStarted() {
    if (!this._isStarted) {
      throw new Error("you must wait for RoonService#start to complete before calling any other methods");
    }
  }
}
