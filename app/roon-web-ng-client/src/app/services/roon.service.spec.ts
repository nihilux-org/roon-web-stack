import { roonCqrsClientMock, roonWebClientFactoryMock } from "@mock/roon-cqrs-client.mock";

import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  CommandStateListener,
  QueueState,
  QueueStateListener,
  RoonState,
  RoonStateListener,
  ZoneDescription,
  ZoneState,
  ZoneStateListener,
} from "@model";
import { RoonService } from "./roon.service";

// FIXME: this test suite is not relevant anymore, need to be rewritten
describe("RoonServiceService", () => {
  let service: RoonService;

  let roonStateListener: RoonStateListener | undefined;
  let commandStateListener: CommandStateListener | undefined;
  let zoneStateListener: ZoneStateListener | undefined;
  let queueStateListener: QueueStateListener | undefined;
  beforeEach(() => {
    roonStateListener = undefined;
    commandStateListener = undefined;
    zoneStateListener = undefined;
    queueStateListener = undefined;
    jest.clearAllMocks();
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoonService);
    roonCqrsClientMock.onRoonState.mockImplementation((listener: RoonStateListener) => {
      roonStateListener = listener;
    });
    roonCqrsClientMock.onCommandState.mockImplementation((listener: CommandStateListener) => {
      commandStateListener = listener;
    });
    roonCqrsClientMock.onZoneState.mockImplementation((listener: ZoneStateListener) => {
      zoneStateListener = listener;
    });
    roonCqrsClientMock.onQueueState.mockImplementation((listener: QueueStateListener) => {
      queueStateListener = listener;
    });
    roonCqrsClientMock.start.mockImplementation(() => Promise.resolve());
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should create a RoonCqrsClient during constructor call", () => {
    expect(roonWebClientFactoryMock.build).toHaveBeenCalledTimes(1);
    expect(roonWebClientFactoryMock.build).toHaveBeenCalledWith(new URL("http://localhost:3000"));
  });

  it("should throw an error on any method other thant #start if #start has not been called and awaited", () => {
    const error = new Error("you must wait for RoonService#start to complete before calling any other methods");
    expect(() => service.zoneState($zoneId)()).toThrow(error);
    expect(() => service.queueState($zoneId)()).toThrow(error);
  });

  it("#start should binds event listeners and return a the Promise returned by its internal RoonCqrsClient#start", async () => {
    await service.start();
    expect(roonStateListener).not.toBeUndefined();
    expect(commandStateListener).not.toBeUndefined();
    expect(zoneStateListener).not.toBeUndefined();
    expect(queueStateListener).not.toBeUndefined();
  });

  it("#start should binds event listeners even if the internal RoonCqrsClient#start returns a rejected Promise", () => {
    const startError = new Error("error");
    roonCqrsClientMock.start.mockImplementation(() => Promise.reject(startError));
    const startPromise = service.start();
    void expect(startPromise).rejects.not.toBe(startError);
    expect(roonStateListener).not.toBeUndefined();
    expect(commandStateListener).not.toBeUndefined();
    expect(zoneStateListener).not.toBeUndefined();
    expect(queueStateListener).not.toBeUndefined();
  });

  it("#roonState should return a Signal<ApiState> with the last received value and updating as new events are received by the internal RoonCqrsClient", async () => {
    await service.start();
    if (roonStateListener) {
      roonStateListener({
        state: RoonState.SYNCING,
        zones: [],
        outputs: [],
      });
      roonStateListener({
        state: RoonState.SYNC,
        zones: [
          {
            zone_id: "zone_id",
            display_name: "display_name",
          },
        ],
        outputs: [],
      });
    }
    const $states = service.roonState();
    expect($states()).toEqual({
      state: RoonState.SYNC,
      zones: [
        {
          zone_id: "zone_id",
          display_name: "display_name",
        },
      ],
      outputs: [],
    });
    if (roonStateListener) {
      roonStateListener({
        state: RoonState.STARTING,
        zones: [],
        outputs: [],
      });
      roonStateListener({
        state: RoonState.LOST,
        zones: [],
        outputs: [],
      });
    }
    expect($states()).toEqual({
      state: RoonState.LOST,
      zones: [],
      outputs: [],
    });
  });

  it("#roonState should return the same Signal<ApiState> at each call", async () => {
    await service.start();
    if (roonStateListener) {
      roonStateListener({
        state: RoonState.SYNC,
        zones: zoneDescriptions,
        outputs: [],
      });
    }
    const states = service.roonState();
    const otherStates = service.roonState();
    expect(states).toBe(otherStates);
  });

  it("#zoneState should return a unique Signal<ZoneState> at each call for a given $zoneId but propagating the same value", async () => {
    await service.start();
    if (roonStateListener) {
      roonStateListener({
        state: RoonState.SYNC,
        zones: zoneDescriptions,
        outputs: [],
      });
    }
    if (zoneStateListener) {
      zoneStateListener(ZONE_STATE);
    }
    const $states = service.zoneState($zoneId);
    const $otherStates = service.zoneState($zoneId);
    expect($states).not.toBe($otherStates);
    expect($states()).toEqual($otherStates());
  });

  it("#queueState should return a Signal<QueueState>, bound to the zone described by given zone_id, with the last received value and updating as new events are received by the internal RoonCqrsClient", async () => {
    await service.start();
    if (roonStateListener) {
      roonStateListener({
        state: RoonState.SYNC,
        zones: zoneDescriptions,
        outputs: [],
      });
    }
    if (zoneStateListener) {
      zoneStateListener(ZONE_STATE);
    }
    if (queueStateListener) {
      queueStateListener({
        ...OTHER_QUEUE_STATE,
        tracks: [...OTHER_QUEUE_STATE.tracks, ...OTHER_QUEUE_STATE.tracks],
      });
      queueStateListener(OTHER_QUEUE_STATE);
      queueStateListener(QUEUE_STATE);
    }
    const states = service.queueState(signal(other_zone_id));
    expect(states()).toBe(OTHER_QUEUE_STATE);
    if (queueStateListener) {
      queueStateListener({
        ...OTHER_ZONE_STATE,
        tracks: [],
      });
      queueStateListener({
        ...OTHER_QUEUE_STATE,
        tracks: [...OTHER_QUEUE_STATE.tracks, ...OTHER_QUEUE_STATE.tracks],
      });
    }
    expect(states()).toEqual({
      ...OTHER_QUEUE_STATE,
      tracks: [...OTHER_QUEUE_STATE.tracks, ...OTHER_QUEUE_STATE.tracks],
    });
    expect(service.queueState($zoneId)()).toBe(QUEUE_STATE);
  });

  it("#queueState should return the same Signal<QueueState> at each call for a given zone_id", async () => {
    await service.start();
    if (roonStateListener) {
      roonStateListener({
        state: RoonState.SYNC,
        zones: zoneDescriptions,
        outputs: [],
      });
    }
    if (queueStateListener) {
      queueStateListener(QUEUE_STATE);
    }
    const $states = service.queueState($zoneId);
    const $otherStates = service.queueState($zoneId);
    expect($states).not.toBe($otherStates);
    expect($states()).toEqual($otherStates());
  });
});

const zone_id = "zone_id";
const $zoneId = signal(zone_id);
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
