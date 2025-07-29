import { roonWorkerMock } from "@mock/worker.utils.mock";

import { beforeEach, describe, expect, it } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ApiStateWorkerEvent } from "@model";
import {
  ClientRoonApiBrowseLoadOptions,
  ClientRoonApiBrowseOptions,
  Command,
  QueueState,
  RoonPath,
  RoonState,
  ZoneDescription,
  ZoneState,
} from "@nihilux/roon-web-model";
import { RoonService } from "./roon.service";

describe("RoonServiceService", () => {
  let service: RoonService;
  let $zoneId: WritableSignal<string>;

  beforeEach(() => {
    $zoneId = signal(zone_id);
    roonWorkerMock.clearMessages();
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoonService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should throw an error on any method depending on roonWorker if #start has not been called and awaited", () => {
    const error = new Error("you must wait for RoonService#start to complete before calling any other methods");
    expect(() => service.zoneState($zoneId)).toThrow(error);
    expect(() => service.queueState($zoneId)).toThrow(error);
    expect(() => {
      service.command({} as Command);
    }).toThrow(error);
    expect(() => service.loadPath("zone_id", {} as RoonPath)).toThrow(error);
    expect(() => service.previous("zone_id", "browse", 42, 42)).toThrow(error);
    expect(() => service.navigate("zone_id", "browse")).toThrow(error);
    expect(() => service.browse({} as ClientRoonApiBrowseOptions)).toThrow(error);
    expect(() => service.load({} as ClientRoonApiBrowseLoadOptions)).toThrow(error);
    expect(() => service.version()).not.toThrow();
    expect(() => service.isGrouping()).not.toThrow();
    expect(() => {
      service.startGrouping();
    }).not.toThrow();
    expect(() => {
      service.endGrouping();
    }).not.toThrow();
  });

  it("#start should send a message to roonWorker to start client, bind the roonWorker on message listener and return a Promise waiting the resolution of version request", async () => {
    expect(roonWorkerMock.onmessage).toBeUndefined();
    await service.start();
    expect(roonWorkerMock.onmessage).not.toBeUndefined();
    expect(roonWorkerMock.messages).toHaveLength(2);
    expect(roonWorkerMock.messages).toEqual([
      {
        event: "worker-client",
        data: {
          action: "start-client",
          url: "http://localhost:3000/",
          isDesktop: true,
        },
      },
      {
        event: "worker-api",
        data: {
          id: 0,
          type: "version",
          data: undefined,
        },
      },
    ]);
  });

  it("#roonState should return a Signal<ApiState> with the last received value and updating as new events are received by the internal RoonCqrsClient", async () => {
    await service.start();
    roonWorkerMock.clearMessages();
    const syncStateEvent: ApiStateWorkerEvent = {
      event: "state",
      data: {
        state: RoonState.SYNC,
        zones: zoneDescriptions,
        outputs: [],
      },
    };
    roonWorkerMock.dispatchEvent(syncStateEvent);
    const $states = service.roonState();
    expect($states()).toEqual({
      state: RoonState.SYNC,
      zones: zoneDescriptions,
      outputs: [],
    });
    const lostStateEvent: ApiStateWorkerEvent = {
      event: "state",
      data: {
        state: RoonState.LOST,
        zones: [],
        outputs: [],
      },
    };
    roonWorkerMock.dispatchEvent(lostStateEvent);
    expect($states()).toEqual({
      state: RoonState.LOST,
      zones: [],
      outputs: [],
    });
  });

  it("#roonState should return the same Signal<ApiState> at each call", async () => {
    await service.start();
    const states = service.roonState();
    const otherStates = service.roonState();
    expect(states).toBe(otherStates);
  });

  it("#zoneState should return a unique Signal<ZoneState> at each call for a given $zoneId but propagating the same value", async () => {
    await service.start();
    roonWorkerMock.clearMessages();
    roonWorkerMock.dispatchEvent({
      event: "zone",
      data: ZONE_STATE,
    });
    roonWorkerMock.dispatchEvent({
      event: "zone",
      data: OTHER_ZONE_STATE,
    });
    const $zoneState = service.zoneState($zoneId);
    const $otherZoneState = service.zoneState($zoneId);
    expect($zoneState).not.toBe($otherZoneState);
    expect($zoneState()).toEqual(ZONE_STATE);
    expect($zoneState()).toEqual($otherZoneState());
    $zoneId.set(OTHER_ZONE_STATE.zone_id);
    expect($zoneState()).toEqual(OTHER_ZONE_STATE);
    expect($zoneState()).toEqual($otherZoneState());
  });

  it("#queueState should return a Signal<QueueState>, bound to the zone described by given zone_id, with the last received value and updating as new events are received by the internal RoonCqrsClient", async () => {
    await service.start();
    roonWorkerMock.clearMessages();
    roonWorkerMock.dispatchEvent({
      event: "queue",
      data: QUEUE_STATE,
    });
    roonWorkerMock.dispatchEvent({
      event: "queue",
      data: OTHER_QUEUE_STATE,
    });
    const $queueState = service.queueState($zoneId);
    const $otherQueueState = service.queueState($zoneId);
    expect($queueState).not.toBe($otherQueueState);
    expect($queueState()).toEqual(QUEUE_STATE);
    expect($queueState()).toEqual($otherQueueState());
    $zoneId.set(OTHER_QUEUE_STATE.zone_id);
    expect($queueState()).toEqual(OTHER_QUEUE_STATE);
    expect($queueState()).toEqual($otherQueueState());
  });
});

const zone_id = "zone_id";
const other_zone_id = "other_zone_id";
const zoneDescriptions: ZoneDescription[] = [
  {
    zone_id,
    display_name: "display_name",
  },
  {
    zone_id: other_zone_id,
    display_name: "other_display_name",
  },
];

const ZONE_STATE: ZoneState = {
  zone_id,
  display_name: "display_name",
  state: "paused",
  outputs: [],
  is_next_allowed: true,
  is_play_allowed: true,
  is_previous_allowed: true,
  is_seek_allowed: true,
  is_pause_allowed: true,
  seek_position: 42,
  queue_items_remaining: 420,
  queue_time_remaining: 4242,
  settings: {
    loop: "disabled",
    shuffle: false,
    auto_radio: true,
  },
  nice_playing: {
    state: "paused",
    nb_items_in_queue: 420,
    total_queue_remaining_time: "42",
    track: {
      title: "track title",
      length: "4242",
      image_key: "track_image_key",
      artist: "track artist",
      seek_position: "424242",
      seek_percentage: 42,
      disk: {
        title: "disk title",
        artist: "disk artist",
        image_key: "disk_image_key",
      },
    },
  },
};

const OTHER_ZONE_STATE: ZoneState = {
  zone_id: other_zone_id,
  display_name: "other_display_name",
  state: "paused",
  outputs: [],
  is_next_allowed: true,
  is_play_allowed: true,
  is_previous_allowed: true,
  is_seek_allowed: true,
  is_pause_allowed: true,
  seek_position: 420,
  queue_items_remaining: 42,
  queue_time_remaining: 424242,
  settings: {
    loop: "disabled",
    shuffle: false,
    auto_radio: true,
  },
  nice_playing: {
    state: "paused",
    nb_items_in_queue: 42,
    total_queue_remaining_time: "420",
    track: {
      title: "other track title",
      length: "424242",
      image_key: "other_track_image_key",
      artist: "other track artist",
      seek_position: "4242",
      seek_percentage: 420,
      disk: {
        title: "other disk title",
        artist: "other disk artist",
        image_key: "other_disk_image_key",
      },
    },
  },
};

const QUEUE_STATE: QueueState = {
  zone_id,
  tracks: [
    {
      title: "track title",
      length: "length",
      artist: "track artist",
      disk: {
        title: "disk title",
        artist: "disk artist",
        image_key: "disk_image_key",
      },
      image_key: "image_key",
      queue_item_id: 42,
    },
  ],
};

const OTHER_QUEUE_STATE: QueueState = {
  zone_id: other_zone_id,
  tracks: [
    {
      title: "other_track title",
      length: "other_length",
      artist: "other_track artist",
      disk: {
        title: "other_disk title",
        artist: "other_disk artist",
        image_key: "other_disk_image_key",
      },
      image_key: "other_image_key",
      queue_item_id: 420,
    },
  ],
};
