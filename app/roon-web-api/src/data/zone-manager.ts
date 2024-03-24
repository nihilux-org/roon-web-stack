import { concatWith, from, Observable, Subject } from "rxjs";
import { dataConverter, queueManagerFactory } from "@data";
import { logger, roon } from "@infrastructure";
import {
  ApiState,
  Output,
  OutputDescription,
  OutputListener,
  QueueManager,
  RoonApiTransportOutputs,
  RoonApiTransportZones,
  RoonServer,
  RoonSseMessage,
  RoonState,
  RoonSubscriptionResponse,
  ServerListener,
  Zone,
  ZoneDescription,
  ZoneListener,
  ZoneManager,
} from "@model";

interface ZoneData {
  backup?: {
    zone?: Zone;
    queue?: RoonSseMessage;
  };
  displayName: string;
  queueManager?: QueueManager;
  zone: Zone;
}

class InternalZoneManager implements ZoneManager {
  private readonly zoneData: Map<string, ZoneData>;
  private _state: RoonState;
  private readonly roonEventSource: Subject<RoonSseMessage>;

  constructor() {
    this._state = RoonState.STARTING;
    this.zoneData = new Map<string, ZoneData>();
    this.roonEventSource = new Subject<RoonSseMessage>();
    this.updateState(RoonState.STARTING);
  }

  private readonly outputListener: OutputListener = (
    core: RoonServer,
    response: RoonSubscriptionResponse,
    body: RoonApiTransportOutputs
  ) => {
    if (response === "Changed") {
      body.changed_outputs?.forEach((o: Output) => {
        const zd = this.zoneData.get(o.zone_id);
        if (zd?.zone) {
          const { outputs, ...zone } = zd.zone;
          const updatedOutputs = [...outputs];
          const updatedOutputIndex = updatedOutputs.findIndex((zo: Output) => zo.output_id === o.output_id);
          updatedOutputs[updatedOutputIndex] = o;
          zd.zone = {
            ...zone,
            outputs: updatedOutputs,
          };
          this.dispatch(zd.zone);
        }
      });
    } else if (response !== "Subscribed") {
      logger.debug("unknown output event '%s' with body %s", response, JSON.stringify(body));
    }
  };

  private readonly zoneListener: ZoneListener = (core, response, body) => {
    let zoneRemoved = false;
    let zoneAdded = false;
    let zoneChanged = false;
    switch (response) {
      case "Changed":
        zoneRemoved = this.dispatchZonesRemoved(body);
        zoneAdded = this.dispatchZonesAdded(body);
        zoneChanged = this.dispatchZonesChanged(body);
        this.dispatchZonesSeeked(body);
        if (zoneRemoved || zoneAdded || zoneChanged) {
          this.updateState(RoonState.SYNC);
        }
        break;
      case "Subscribed":
        this.dispatchZonesSubscribed(body);
        break;
      case "Unsubscribed":
        this.dispatchZonesUnsubscribed(body);
        break;
      default:
        logger.debug("unknown zone event '$%s' with body %s", response, JSON.stringify(body));
        break;
    }
  };

  private dispatchZonesSubscribed = (body: RoonApiTransportZones): void => {
    const zones = body.zones ?? [];
    this.initZones(zones);
  };

  private dispatchZonesUnsubscribed = (body: RoonApiTransportZones): void => {
    logger.warn("zones unsubscribed: %s", JSON.stringify(body));
    this.stop();
  };

  private dispatchZonesRemoved = (body: RoonApiTransportZones): boolean => {
    const zoneRemoved = body.zones_removed ?? [];
    for (const zone_id of zoneRemoved) {
      this.zoneData.get(zone_id)?.queueManager?.stop();
      this.zoneData.delete(zone_id);
    }
    return zoneRemoved.length > 0;
  };

  private dispatchZonesAdded = (body: RoonApiTransportZones): boolean => {
    const zoneAdded = body.zones_added ?? [];
    for (const z of zoneAdded) {
      if (this.initZone(z)) {
        this.dispatch(z);
      }
    }
    return zoneAdded.length > 0;
  };

  private dispatchZonesChanged = (body: RoonApiTransportZones): boolean => {
    const zoneChanged = body.zones_changed ?? [];
    let hasZoneChanged = false;
    for (const z of zoneChanged) {
      const zd = this.zoneData.get(z.zone_id);
      if (zd) {
        hasZoneChanged = true;
        zd.zone = z;
        zd.displayName = z.display_name;
        this.dispatch(zd.zone);
      }
    }
    return hasZoneChanged;
  };

  private dispatchZonesSeeked = (body: RoonApiTransportZones): void => {
    const zoneSeeked = body.zones_seek_changed ?? [];
    for (const zs of zoneSeeked) {
      const zd = this.zoneData.get(zs.zone_id);
      if (zd?.zone) {
        const updatedZone: Zone = { ...zd.zone };
        if (zs.seek_position) {
          updatedZone.seek_position = zs.seek_position;
          if (updatedZone.now_playing) {
            updatedZone.now_playing.seek_position = zs.seek_position;
          }
        }
        if (zs.queue_time_remaining) {
          updatedZone.queue_time_remaining = zs.queue_time_remaining;
        }
        zd.zone = updatedZone;
        this.dispatch(zd.zone);
      }
    }
  };

  private serverPairedFactory = (resolve: () => void): ServerListener => {
    return () => {
      const firstPairing: boolean = this._state === RoonState.STARTING;
      roon.onZones(this.zoneListener);
      roon.onOutputs(this.outputListener);
      if (firstPairing) {
        this.updateState(RoonState.SYNCING);
        resolve();
      } else {
        this.reconnect();
      }
    };
  };

  private readonly reconnect = () => {
    for (const zd of this.zoneData.values()) {
      if (zd.backup?.zone) {
        zd.zone = zd.backup.zone;
        zd.queueManager = queueManagerFactory.build(zd.zone, this.roonEventSource, 150);
        void zd.queueManager
          .start()
          .then(() => {
            delete zd.backup?.queue;
          })
          .catch((err: unknown) => {
            logger.error(err);
          });
      }
    }
    if (this._state !== RoonState.SYNC) {
      this.updateState(RoonState.SYNCING);
    }
  };

  private readonly dispatch = (zone: Zone): void => {
    this.roonEventSource.next(dataConverter.toRoonSseMessage(zone));
  };

  private readonly serverLost: ServerListener = () => {
    roon.offZones(this.zoneListener);
    roon.offOutputs(this.outputListener);
    for (const zd of this.zoneData.values()) {
      zd.backup = {
        zone: zd.zone,
        queue: zd.queueManager?.isStarted() ? zd.queueManager.queue() : undefined,
      };
      zd.queueManager?.stop();
      delete zd.queueManager;
    }
    this.updateState(RoonState.LOST);
  };

  private initZones = (zones: Zone[]): void => {
    zones.forEach(this.initZone);
    this.updateState(RoonState.SYNC);
    for (const zd of this.zoneData.values()) {
      this.dispatch(zd.zone);
    }
  };

  private initZone = (z: Zone): boolean => {
    const zd = this.zoneData.get(z.zone_id);
    if (!zd) {
      const queueManager = queueManagerFactory.build(z, this.roonEventSource, 150);
      this.zoneData.set(z.zone_id, {
        displayName: z.display_name,
        queueManager,
        zone: z,
      });
      void queueManager.start().catch((err: unknown) => {
        logger.error(err);
      });
      return true;
    } else {
      return false;
    }
  };

  start = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (this._state === RoonState.STARTING) {
        roon.onServerLost(this.serverLost);
        roon.onServerPaired(this.serverPairedFactory(resolve));
        roon.startExtension();
      } else {
        reject(new Error("zoneManager as already been started"));
      }
    });
  };

  zones = (): ZoneDescription[] => {
    const zds: ZoneDescription[] = [];
    for (const [zone_id, zoneData] of this.zoneData) {
      zds.push({
        zone_id,
        display_name: zoneData.displayName,
      });
    }
    return zds;
  };

  stop = (): void => {
    roon.offZones(this.zoneListener);
    roon.offOutputs(this.outputListener);
    this.zoneData.forEach((zoneData: ZoneData) => {
      zoneData.queueManager?.stop();
    });
    this.zoneData.clear();
    this.updateState(RoonState.STOPPED);
    this.roonEventSource.complete();
  };

  private buildApiState = (): ApiState => {
    const zones: ZoneDescription[] = [];
    const outputs: OutputDescription[] = [];
    for (const [zone_id, zoneData] of this.zoneData) {
      zones.push({
        zone_id,
        display_name: zoneData.displayName,
      });
      for (const output of zoneData.zone.outputs) {
        outputs.push({
          output_id: output.output_id,
          zone_id,
          display_name: output.display_name,
        });
      }
    }
    return {
      state: this._state,
      zones: zones.sort((z1, z2) => z1.display_name.localeCompare(z2.display_name)),
      outputs: outputs.sort((o1, o2) => o1.display_name.localeCompare(o2.display_name)),
    };
  };

  private updateState = (state: RoonState): void => {
    this._state = state;
    this.roonEventSource.next(dataConverter.toRoonSseMessage(this.buildApiState()));
  };

  events = (): Observable<RoonSseMessage> => {
    const initValues: RoonSseMessage[] = [];
    for (const zd of this.zoneData.values()) {
      initValues.push(dataConverter.toRoonSseMessage(zd.zone));
      if (zd.queueManager?.isStarted()) {
        initValues.push(zd.queueManager.queue());
      } else if (zd.backup?.queue) {
        initValues.push(zd.backup.queue);
      }
    }
    initValues.push(dataConverter.toRoonSseMessage(this.buildApiState()));
    return from(initValues).pipe(concatWith(this.roonEventSource));
  };

  isStarted = (): boolean => {
    return this._state !== RoonState.STOPPED && this._state !== RoonState.STARTING;
  };
}

export const zoneManager: ZoneManager = new InternalZoneManager();
