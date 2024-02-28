import { defer, from, Observable, retry, timer } from "rxjs";
import { computed, Injectable, Signal, signal, WritableSignal } from "@angular/core";
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
  ZoneDescription,
  ZoneState,
  ZoneStateListener,
} from "@model";
import { roonWebClientFactory, UPDATE_NEEDED_ERROR_MESSAGE } from "@nihilux/roon-web-client";

@Injectable({
  providedIn: "root",
})
export class RoonService {
  private static readonly THIS_IS_A_BUG_ERROR_MSG = "this is a bug!";

  private readonly _roonClient: RoonWebClient;
  private readonly _roonStateListener: RoonStateListener;
  private readonly _$roonState: WritableSignal<ApiState>;
  private readonly _commandStateListener: CommandStateListener;
  private readonly _$commandState: WritableSignal<CommandState | undefined>;
  private readonly _zoneStateListener: ZoneStateListener;
  private readonly _zoneStates?: Map<
    string,
    {
      $zone?: WritableSignal<ZoneState>;
      $queue?: WritableSignal<QueueState>;
    }
  >;
  private readonly _queueStateListener: QueueStateListener;
  private _isStarted: boolean;

  constructor() {
    this._$roonState = signal({
      state: RoonState.STARTING,
      zones: [],
    });
    this._roonClient = roonWebClientFactory.build(new URL(window.location.href));
    this._roonStateListener = (state: ApiState): void => {
      this._$roonState.set(state);
      if (state.state === RoonState.STOPPED) {
        this.reconnect();
      }
    };
    this._$commandState = signal(undefined);
    this._commandStateListener = (notification: CommandState): void => {
      this._$commandState.set(notification);
    };
    this._zoneStates = new Map<
      string,
      {
        $zone?: WritableSignal<ZoneState>;
        $queue?: WritableSignal<QueueState>;
      }
    >();
    this._zoneStateListener = (state: ZoneState): void => {
      const zs = this._zoneStates?.get(state.zone_id);
      if (zs) {
        if (zs.$zone) {
          zs.$zone.set(state);
        } else {
          zs.$zone = signal(state);
        }
      } else {
        this._zoneStates?.set(state.zone_id, {
          $zone: signal(state),
        });
      }
    };
    this._queueStateListener = (state: QueueState): void => {
      const zs = this._zoneStates?.get(state.zone_id);
      if (zs) {
        if (zs.$queue) {
          zs.$queue.set(state);
        } else {
          zs.$queue = signal(state);
        }
      } else {
        this._zoneStates?.set(state.zone_id, {
          $queue: signal(state),
        });
      }
    };
    this._isStarted = false;
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
        }
        // silently ignored: an error here means the extension has not been authorized in roon
        // the UI  displays a message explaining the situation
      });
  };

  roonState: () => Signal<RoonState> = () => {
    return computed(() => {
      return this._$roonState().state;
    });
  };

  zones: () => Signal<ZoneDescription[]> = () => {
    this.ensureStarted();
    return computed(() => {
      return this._$roonState().zones.sort((z1, z2) => z1.display_name.localeCompare(z2.display_name));
    });
  };

  commandState: () => Signal<CommandState | undefined> = () => {
    this.ensureStarted();
    return this._$commandState;
  };

  zoneState: ($zoneId: Signal<string>) => Signal<ZoneState> = ($zoneId: Signal<string>) => {
    this.ensureStarted();
    return computed(() => {
      const zs = this._zoneStates?.get($zoneId());
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
      const zs = this._zoneStates?.get($zoneId());
      if (zs?.$queue) {
        return zs.$queue();
      } else {
        // FIXME: this is very dangerous (possible memoization of an Error)
        // find a better to handle this (especially because it should never happen)
        throw new Error(RoonService.THIS_IS_A_BUG_ERROR_MSG);
      }
    });
  };

  command: (command: Command) => void = (command: Command) => {
    this.ensureStarted();
    this._roonClient.command(command).catch((err) => {
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
