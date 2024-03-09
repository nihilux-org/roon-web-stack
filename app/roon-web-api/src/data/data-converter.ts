import {
  ApiState,
  CommandSseMessage,
  CommandState,
  DataConverter,
  Disk,
  Queue,
  QueueItem,
  QueueSseMessage,
  QueueState,
  QueueTrack,
  RoonSseMessage,
  SseStateMessage,
  Track,
  Zone,
  ZoneNicePlaying,
  ZoneNowPlaying,
  ZoneSseMessage,
  ZoneState,
} from "@model";

const toRoonSseMessage = (data: Queue | Zone | ApiState | CommandState): RoonSseMessage => {
  if ("display_name" in data) {
    return toZoneSseMessage(convertZone(data));
  } else if ("items" in data) {
    return toQueueSseMessage(convertQueue(data));
  } else if ("command_id" in data) {
    return toCommandSseControlMessage(data);
  } else {
    return toControlSseMessage(data);
  }
};

const toZoneSseMessage = (data: ZoneState): ZoneSseMessage => ({
  event: "zone",
  data,
});

const toQueueSseMessage = (data: QueueState): QueueSseMessage => ({
  event: "queue",
  data,
});

const toControlSseMessage = (data: ApiState): SseStateMessage => ({
  event: "state",
  data,
});

const toCommandSseControlMessage = (data: CommandState): CommandSseMessage => ({
  event: "command_state",
  data,
});

const convertZone = (zone: Zone): ZoneState => {
  const { now_playing, ...zoneState } = zone;
  if (now_playing) {
    const nicePlaying = buildNicePlaying(now_playing, zone);
    return {
      ...zoneState,
      nice_playing: nicePlaying,
    };
  } else {
    return {
      ...zoneState,
    };
  }
};

const convertQueue = (queue: Queue): QueueState => {
  const tracks = queue.items.map(convertQueueItem);
  return {
    zone_id: queue.zone_id,
    tracks,
  };
};

const convertQueueItem = (item: QueueItem): QueueTrack => {
  const { image_key, length, queue_item_id } = item;
  const convertedLength = secondsToTimeString(length);
  let track: QueueTrack;
  if (item.three_line.line3) {
    const disk: Disk = {
      title: item.three_line.line3,
      artist: item.three_line.line2,
      image_key,
    };
    track = {
      disk,
      title: item.three_line.line1,
      artist: item.three_line.line2,
      length: convertedLength,
      image_key,
      queue_item_id,
    };
  } else if (item.two_line.line2) {
    track = {
      title: item.two_line.line1,
      artist: item.two_line.line2,
      length: convertedLength,
      image_key,
      queue_item_id,
    };
  } else {
    track = {
      title: item.one_line.line1,
      length: convertedLength,
      image_key,
      queue_item_id,
    };
  }
  return track;
};

const buildNicePlaying = (now_playing: ZoneNowPlaying, zone: Zone): ZoneNicePlaying => {
  const { length, seek_position, image_key } = now_playing;
  const { queue_time_remaining, queue_items_remaining, state } = zone;
  const totalQueueRemainingTime = secondsToTimeString(queue_time_remaining);
  const nbItemsInQueue = queue_items_remaining;
  const seek_percentage: number | undefined =
    seek_position && length && length > 0 ? Number.parseFloat(((seek_position / length) * 100).toFixed(2)) : undefined;
  let track: Track;
  if (now_playing.three_line.line3) {
    const disk: Disk = {
      title: now_playing.three_line.line3,
      artist: now_playing.three_line.line2,
      image_key,
    };
    track = {
      disk,
      title: now_playing.three_line.line1,
      length: secondsToTimeString(length),
      seek_position: secondsToTimeString(seek_position),
      image_key,
      artist: now_playing.three_line.line2,
      seek_percentage,
    };
  } else if (now_playing.two_line.line2) {
    track = {
      title: now_playing.two_line.line1,
      length: secondsToTimeString(length),
      seek_position: secondsToTimeString(seek_position),
      image_key,
      artist: now_playing.two_line.line2,
      seek_percentage,
    };
  } else {
    track = {
      title: now_playing.one_line.line1,
      length: secondsToTimeString(length),
      seek_position: secondsToTimeString(seek_position),
      image_key,
      seek_percentage,
    };
  }
  return {
    state,
    nb_items_in_queue: nbItemsInQueue,
    total_queue_remaining_time: totalQueueRemainingTime,
    track,
  };
};

const secondsInMinutes = 60;
const minute = secondsInMinutes;
const minutesInHour = 60;
const hour = minutesInHour * minute;
const hoursInDay = 24;
const day = hoursInDay * hour;

const secondsToTimeString = (secondsToConvert: number | undefined): string | undefined => {
  if (secondsToConvert === undefined) {
    return undefined;
  }
  const days = (secondsToConvert - (secondsToConvert % day)) / day;
  const hours = ((secondsToConvert - (secondsToConvert % hour)) / hour) % hoursInDay;
  const minutes = ((secondsToConvert - (secondsToConvert % minute)) / minute) % minutesInHour;
  const seconds = secondsToConvert % secondsInMinutes;
  let toDisplay = `${toTwoDigitString(minutes)}:${toTwoDigitString(seconds)}`;
  if (hours > 0 || days > 0) {
    toDisplay = `${toTwoDigitString(hours)}:${toDisplay}`;
  }
  if (days > 0) {
    toDisplay = `${days}d ${toDisplay}`;
  }
  return toDisplay;
};

const toTwoDigitString = (toFormat: number): string => {
  return toFormat.toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
};

export const dataConverter: DataConverter = {
  convertZone,
  convertQueue,
  secondsToTimeString,
  toRoonSseMessage,
};
