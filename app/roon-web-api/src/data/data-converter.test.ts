import {
  ApiState,
  CommandResult,
  CommandState,
  Queue,
  QueueItem,
  QueueTrack,
  RoonState,
  Zone,
  ZoneNowPlaying,
} from "@model";
import { dataConverter } from "./data-converter";

describe("data-converter test suite", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("dataConverter#secondsToTimeString should return undefined on undefined", () => {
    const converted = dataConverter.secondsToTimeString(undefined);
    expect(converted).toBeUndefined();
  });
  it("dataConverter#secondsToTimeString should always return at least a for format digit", () => {
    const converted_0 = dataConverter.secondsToTimeString(0);
    expect(converted_0).toEqual("00:00");
    const converted_7 = dataConverter.secondsToTimeString(7);
    expect(converted_7).toEqual("00:07");
    const converted_59 = dataConverter.secondsToTimeString(59);
    expect(converted_59).toEqual("00:59");
  });
  it("dataConverter#secondsToTimeString should manage minutes", () => {
    const converted_1 = dataConverter.secondsToTimeString(60);
    expect(converted_1).toEqual("01:00");
    const converted_101 = dataConverter.secondsToTimeString(101);
    expect(converted_101).toEqual("01:41");
    const _23min23 = 23 * 60 + 23;
    const converted_23min23 = dataConverter.secondsToTimeString(_23min23);
    expect(converted_23min23).toEqual("23:23");
    const _59min59 = 59 * 60 + 59;
    const converted_59min59 = dataConverter.secondsToTimeString(_59min59);
    expect(converted_59min59).toEqual("59:59");
  });
  it("dataConverter#secondsToTimeString should manage hours", () => {
    const converted_1 = dataConverter.secondsToTimeString(3600);
    expect(converted_1).toEqual("01:00:00");
    const converted_101 = dataConverter.secondsToTimeString(3661);
    expect(converted_101).toEqual("01:01:01");
    const _23h23min23 = 23 * 3600 + 23 * 60 + 23;
    const converted_23min23 = dataConverter.secondsToTimeString(_23h23min23);
    expect(converted_23min23).toEqual("23:23:23");
    const _17h0min17 = 17 * 3600 + 17;
    const converted_17h0min17 = dataConverter.secondsToTimeString(_17h0min17);
    expect(converted_17h0min17).toEqual("17:00:17");
  });
  it("dataConverter#secondsToTimeString should manage day", () => {
    const converted_1 = dataConverter.secondsToTimeString(24 * 3600);
    expect(converted_1).toEqual("1d 00:00:00");
    const converted_101 = dataConverter.secondsToTimeString(24 * 3600 + 3661);
    expect(converted_101).toEqual("1d 01:01:01");
    const _23d23h23min23 = 23 * 24 * 3600 + 23 * 3600 + 23 * 60 + 23;
    const converted_23d23h23min23 = dataConverter.secondsToTimeString(_23d23h23min23);
    expect(converted_23d23h23min23).toEqual("23d 23:23:23");
  });

  it("dataConverter#convertZone should forward every attribute of the given zone, except now_playing", () => {
    const zoneState = dataConverter.convertZone(ZONE_WITHOUT_NOW_PLAYING);
    expect(zoneState).toEqual(ZONE_WITHOUT_NOW_PLAYING);
  });
  it("dataConverter#convertZone should use the max info in nicePlaying", () => {
    const zoneStateComplete = dataConverter.convertZone({
      ...ZONE_WITHOUT_NOW_PLAYING,
      now_playing: NOW_PLAYING_3_LINE_COMPLETE,
    });
    expect(zoneStateComplete.nice_playing).not.toBeNull();
    expect(zoneStateComplete.nice_playing?.state).toEqual(ZONE_WITHOUT_NOW_PLAYING.state);
    expect(zoneStateComplete.nice_playing?.nb_items_in_queue).toEqual(ZONE_WITHOUT_NOW_PLAYING.queue_items_remaining);
    expect(zoneStateComplete.nice_playing?.total_queue_remaining_time).toEqual(
      dataConverter.secondsToTimeString(ZONE_WITHOUT_NOW_PLAYING.queue_time_remaining)
    );
    expect(zoneStateComplete.nice_playing?.track.length).toEqual(
      dataConverter.secondsToTimeString(NOW_PLAYING_3_LINE_COMPLETE.length)
    );
    expect(zoneStateComplete.nice_playing?.track.seek_position).toEqual(
      dataConverter.secondsToTimeString(NOW_PLAYING_3_LINE_COMPLETE.seek_position)
    );
    expect(zoneStateComplete.nice_playing?.track.image_key).toEqual(NOW_PLAYING_3_LINE_COMPLETE.image_key);
    expect(zoneStateComplete.nice_playing?.track.title).toEqual(NOW_PLAYING_3_LINE_COMPLETE.three_line.line1);
    expect(zoneStateComplete.nice_playing?.track.artist).toEqual(NOW_PLAYING_3_LINE_COMPLETE.three_line.line2);
    expect(zoneStateComplete.nice_playing?.track.disk?.title).toEqual(NOW_PLAYING_3_LINE_COMPLETE.three_line.line3);

    const zoneStateTwoLines = dataConverter.convertZone({
      ...ZONE_WITHOUT_NOW_PLAYING,
      now_playing: NOW_PLAYING_3_LINE_INCOMPLETE,
    });
    expect(zoneStateTwoLines.nice_playing).not.toBeNull();
    expect(zoneStateTwoLines.nice_playing?.state).toEqual(ZONE_WITHOUT_NOW_PLAYING.state);
    expect(zoneStateTwoLines.nice_playing?.nb_items_in_queue).toEqual(ZONE_WITHOUT_NOW_PLAYING.queue_items_remaining);
    expect(zoneStateTwoLines.nice_playing?.total_queue_remaining_time).toEqual(
      dataConverter.secondsToTimeString(ZONE_WITHOUT_NOW_PLAYING.queue_time_remaining)
    );
    expect(zoneStateTwoLines.nice_playing?.track.length).toEqual(
      dataConverter.secondsToTimeString(NOW_PLAYING_3_LINE_INCOMPLETE.length)
    );
    expect(zoneStateTwoLines.nice_playing?.track.seek_position).toEqual(
      dataConverter.secondsToTimeString(NOW_PLAYING_3_LINE_INCOMPLETE.seek_position)
    );
    expect(zoneStateTwoLines.nice_playing?.track.image_key).toEqual(NOW_PLAYING_3_LINE_INCOMPLETE.image_key);
    expect(zoneStateTwoLines.nice_playing?.track.title).toEqual(NOW_PLAYING_3_LINE_INCOMPLETE.two_line.line1);
    expect(zoneStateTwoLines.nice_playing?.track.artist).toEqual(NOW_PLAYING_3_LINE_INCOMPLETE.two_line.line2);

    const zoneStateOneLine = dataConverter.convertZone({
      ...ZONE_WITHOUT_NOW_PLAYING,
      now_playing: NOW_PLAYING_2_LINE_INCOMPLETE,
    });
    expect(zoneStateOneLine.nice_playing).not.toBeNull();
    expect(zoneStateOneLine.nice_playing?.state).toEqual(ZONE_WITHOUT_NOW_PLAYING.state);
    expect(zoneStateOneLine.nice_playing?.nb_items_in_queue).toEqual(ZONE_WITHOUT_NOW_PLAYING.queue_items_remaining);
    expect(zoneStateOneLine.nice_playing?.total_queue_remaining_time).toEqual(
      dataConverter.secondsToTimeString(ZONE_WITHOUT_NOW_PLAYING.queue_time_remaining)
    );
    expect(zoneStateOneLine.nice_playing?.track.length).toEqual(
      dataConverter.secondsToTimeString(NOW_PLAYING_2_LINE_INCOMPLETE.length)
    );
    expect(zoneStateOneLine.nice_playing?.track.seek_position).toEqual(
      dataConverter.secondsToTimeString(NOW_PLAYING_2_LINE_INCOMPLETE.seek_position)
    );
    expect(zoneStateOneLine.nice_playing?.track.image_key).toEqual(NOW_PLAYING_2_LINE_INCOMPLETE.image_key);
    expect(zoneStateOneLine.nice_playing?.track.title).toEqual(NOW_PLAYING_2_LINE_INCOMPLETE.one_line.line1);
  });
  it("dataConvert#convertZone should compute the current track percentage with at max tw digit precision, or default to undefined if seek_position or length is missing", () => {
    const zoneState = dataConverter.convertZone({
      ...ZONE_WITHOUT_NOW_PLAYING,
      now_playing: {
        ...NOW_PLAYING_3_LINE_COMPLETE,
        seek_position: 42424,
        length: 100000,
      },
    });
    expect(zoneState.nice_playing?.track.seek_percentage).toEqual(42.42);

    const zoneState_without_length = dataConverter.convertZone({
      ...ZONE_WITHOUT_NOW_PLAYING,
      now_playing: {
        ...NOW_PLAYING_3_LINE_COMPLETE,
        seek_position: 4242,
        length: undefined,
      },
    });
    expect(zoneState_without_length.nice_playing?.track.seek_percentage).toBeUndefined();

    const zoneState_with_length_0 = dataConverter.convertZone({
      ...ZONE_WITHOUT_NOW_PLAYING,
      now_playing: {
        ...NOW_PLAYING_3_LINE_COMPLETE,
        seek_position: 4242,
        length: 0,
      },
    });
    expect(zoneState_with_length_0.nice_playing?.track.seek_percentage).toBeUndefined();

    const zoneState_without_seek_position = dataConverter.convertZone({
      ...ZONE_WITHOUT_NOW_PLAYING,
      now_playing: {
        ...NOW_PLAYING_3_LINE_COMPLETE,
        length: 4242,
        seek_position: undefined,
      },
    });
    expect(zoneState_without_seek_position.nice_playing?.track.seek_percentage).toBeUndefined();
  });

  it("dataConverter#convertQueue should convert each provided items", () => {
    const items: QueueItem[] = [
      {
        queue_item_id: 42,
        length: 42,
        one_line: {
          line1: "first_item",
        },
        two_line: {
          line1: "first_item",
        },
        three_line: {
          line1: "first_item",
        },
        image_key: "image_key",
      },
      {
        queue_item_id: 42,
        length: 42,
        one_line: {
          line1: "second_item",
        },
        two_line: {
          line1: "second_item",
        },
        three_line: {
          line1: "second_item",
        },
        image_key: "image_key",
      },
      {
        queue_item_id: 42,
        length: 42,
        one_line: {
          line1: "third_item",
        },
        two_line: {
          line1: "second_item",
        },
        three_line: {
          line1: "second_item",
        },
        image_key: "image_key",
      },
    ];

    const result = dataConverter.convertQueue({
      zone_id: "zone_id",
      items,
    });

    expect(result.tracks.length).toEqual(items.length);
    expect(result.zone_id).toEqual("zone_id");
  });

  it("dataConverter#convertQueue should map as much info in QueueTrack as possible", () => {
    const zone_id = "zone_id";

    const oneLineItem: QueueItem = {
      queue_item_id: 42,
      length: 42,
      one_line: {
        line1: "first_item",
      },
      two_line: {
        line1: "second_item",
      },
      three_line: {
        line1: "second_item",
      },
      image_key: "image_key",
    };

    const oneLineResult = dataConverter.convertQueue({
      zone_id,
      items: [oneLineItem],
    });

    const oneLineTrack: QueueTrack = oneLineResult.tracks[0];
    expect(oneLineTrack.queue_item_id).toEqual(oneLineItem.queue_item_id);
    expect(oneLineTrack.image_key).toEqual(oneLineItem.image_key);
    expect(oneLineTrack.length).toEqual(dataConverter.secondsToTimeString(oneLineItem.length));
    expect(oneLineTrack.title).toEqual(oneLineItem.one_line.line1);
    expect(oneLineTrack.artist).toBeUndefined();
    expect(oneLineTrack.disk).toBeUndefined();

    const twoLineItem: QueueItem = {
      queue_item_id: 42,
      length: 42,
      one_line: {
        line1: "other",
      },
      two_line: {
        line1: "line1",
        line2: "line2",
      },
      three_line: {
        line1: "second_item",
      },
      image_key: "image_key",
    };

    const twoLineResult = dataConverter.convertQueue({
      zone_id,
      items: [twoLineItem],
    });

    const twoLineTrack: QueueTrack = twoLineResult.tracks[0];
    expect(twoLineTrack.queue_item_id).toEqual(twoLineItem.queue_item_id);
    expect(twoLineTrack.image_key).toEqual(twoLineItem.image_key);
    expect(twoLineTrack.length).toEqual(dataConverter.secondsToTimeString(twoLineItem.length));
    expect(twoLineTrack.title).toEqual(twoLineItem.two_line.line1);
    expect(twoLineTrack.artist).toEqual(twoLineItem.two_line.line2);
    expect(twoLineTrack.disk).toBeUndefined();

    const threeLineItem: QueueItem = {
      queue_item_id: 42,
      length: 42,
      one_line: {
        line1: "other",
      },
      two_line: {
        line1: "other",
        line2: "other",
      },
      three_line: {
        line1: "line1",
        line2: "line2",
        line3: "line3",
      },
      image_key: "image_key",
    };

    const threeLineResult = dataConverter.convertQueue({
      zone_id,
      items: [threeLineItem],
    });

    const threeLineTrack: QueueTrack = threeLineResult.tracks[0];
    expect(threeLineTrack.queue_item_id).toEqual(threeLineItem.queue_item_id);
    expect(threeLineTrack.image_key).toEqual(threeLineItem.image_key);
    expect(threeLineTrack.length).toEqual(dataConverter.secondsToTimeString(threeLineItem.length));
    expect(threeLineTrack.title).toEqual(threeLineItem.three_line.line1);
    expect(threeLineTrack.artist).toEqual(threeLineItem.three_line.line2);
    expect(threeLineTrack.disk?.artist).toEqual(threeLineItem.three_line.line2);
    expect(threeLineTrack.disk?.image_key).toEqual(threeLineItem.image_key);
    expect(threeLineTrack.disk?.title).toEqual(threeLineItem.three_line.line3);
  });

  it("dataConverter#toRoonSseMessage should return a ZoneSseMessage when called with a ZoneState", () => {
    const zone: Zone = {
      display_name: "display_name",
    } as unknown as Zone;
    const roonSseMessage = dataConverter.toRoonSseMessage(zone);
    expect(roonSseMessage.event).toEqual("zone");
    expect(roonSseMessage.data).toEqual(dataConverter.convertZone(zone));
  });

  it("dataConverter#toRoonSseMessage should return a QueueSseMessage when called with a QueueState", () => {
    const queue: Queue = {
      items: [] as QueueItem[],
      zone_id: "zone_id",
    };
    const roonSseMessage = dataConverter.toRoonSseMessage(queue);
    expect(roonSseMessage.event).toEqual("queue");
    expect(roonSseMessage.data).toEqual(dataConverter.convertQueue(queue));
  });

  it("dataConverter#toRoonSseMessage should return a ControlSseMessage when called with a ApiState", () => {
    const apiState: ApiState = {
      state: RoonState.SYNC,
      zones: [],
      outputs: [],
    };
    const roonSseMessage = dataConverter.toRoonSseMessage(apiState);
    expect(roonSseMessage.event).toEqual("state");
    expect(roonSseMessage.data).toBe(apiState);
  });

  it("dataConverter#toRoonSseMessage should return a CommandControlSseMessage when called with a CommandNotification", () => {
    const commandNotification: CommandState = {
      command_id: "command_id",
      state: CommandResult.APPLIED,
    };
    const roonSseMessage = dataConverter.toRoonSseMessage(commandNotification);
    expect(roonSseMessage.event).toEqual("command_state");
    expect(roonSseMessage.data).toBe(commandNotification);
  });
});

const ZONE_WITHOUT_NOW_PLAYING: Zone = {
  zone_id: "zone_id",
  queue_items_remaining: 42,
  queue_time_remaining: 420,
  seek_position: 4242,
  display_name: "display_name",
  is_next_allowed: true,
  is_pause_allowed: true,
  is_play_allowed: true,
  is_previous_allowed: true,
  is_seek_allowed: true,
  state: "playing",
  outputs: [
    {
      zone_id: "zone_id",
      display_name: "output_display_name",
      output_id: "output_id",
      can_group_with_output_ids: ["0", "1", "2"],
      volume: {
        type: "number",
        max: 42,
        min: 4242,
        value: 420,
        step: 42,
        is_muted: true,
      },
    },
  ],
};

const NOW_PLAYING_3_LINE_COMPLETE: ZoneNowPlaying = {
  length: 4242,
  seek_position: 42,
  three_line: {
    line1: "line1 🤷",
    line2: "line2 😅",
    line3: "line3 ✨",
  },
  two_line: {
    line1: "other",
    line2: "other",
  },
  one_line: {
    line1: "other",
  },
  image_key: "image_key 🫶",
};

const NOW_PLAYING_3_LINE_INCOMPLETE: ZoneNowPlaying = {
  length: 111,
  seek_position: 22,
  three_line: {
    line1: "other",
    line2: "other",
  },
  two_line: {
    line1: "line1a",
    line2: "line2b",
  },
  one_line: {
    line1: "other",
  },
  image_key: "image_key",
};

const NOW_PLAYING_2_LINE_INCOMPLETE: ZoneNowPlaying = {
  length: 333,
  seek_position: 22,
  three_line: {
    line1: "other",
  },
  two_line: {
    line1: "other",
  },
  one_line: {
    line1: "line1c",
  },
  image_key: "image_key",
};
