import { roonMock } from "../infrastructure/roon-extension.mock";
import { commandDispatcherMock } from "../service/command-dispatcher.mock";

import { logger } from "@infrastructure";
import {
  ExtensionSettings,
  InternalCommandType,
  QueueBot,
  QueueItem,
  SettingsManager,
  SettingsUpdateListener,
} from "@model";

describe("queue-bot-manager.ts test suite", () => {
  let settingsManager: SettingsManager<ExtensionSettings>;
  let settingsListener: SettingsUpdateListener<ExtensionSettings>;
  let queueBot: QueueBot;
  beforeEach(() => {
    jest.isolateModules((): void => {
      void import("./queue-bot-manager")
        .then((module) => {
          queueBot = module.queueBot;
        })
        .catch((err: unknown) => {
          logger.error(err);
        });
    });
    settingsManager = {
      onSettings: jest.fn().mockImplementation((listener: SettingsUpdateListener<ExtensionSettings>) => {
        settingsListener = listener;
      }),
    } as unknown as SettingsManager<ExtensionSettings>;
    roonMock.settings.mockImplementation(() => settingsManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("queueBot should listen on settings and act accordingly", () => {
    queueBot.start(roonMock);
    expect(settingsManager.onSettings).toHaveBeenCalled();
    expect(settingsListener).toBeDefined();
    // do nothing before first settings value dispatch
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStopQueueItem],
    });
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStandbyQueueItem],
    });
    expect(commandDispatcherMock.dispatchInternal).not.toHaveBeenCalled();
    // works with settings
    settingsListener(QUEUE_BOT_ENABLED_EXTENSION_SETTINGS);
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStopQueueItem],
    });
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStandbyQueueItem],
    });
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenCalledTimes(2);
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenNthCalledWith(1, {
      type: InternalCommandType.STOP_NEXT,
      data: {
        zone_id,
      },
    });
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenNthCalledWith(2, {
      type: InternalCommandType.STANDBY_NEXT,
      data: {
        zone_id,
      },
    });
    // update its enabled state based on settings
    settingsListener({
      ...QUEUE_BOT_ENABLED_EXTENSION_SETTINGS,
      nr_queue_bot_state: "disabled",
    });
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStopQueueItem],
    });
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStandbyQueueItem],
    });
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenCalledTimes(2);
    // update the artist to watch based on settings
    const newArtistName = "new_queue_bot_artist_name";
    settingsListener({
      ...QUEUE_BOT_ENABLED_EXTENSION_SETTINGS,
      nr_queue_bot_artist_name: newArtistName,
    });
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStopQueueItem],
    });
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStandbyQueueItem],
    });
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenCalledTimes(2);
    queueBot.watchQueue({
      zone_id,
      items: [
        {
          ...queueBotStopQueueItem,
          three_line: {
            ...queueBotStopQueueItem.three_line,
            line2: newArtistName,
          },
        },
      ],
    });
    queueBot.watchQueue({
      zone_id,
      items: [
        {
          ...queueBotStandbyQueueItem,
          two_line: {
            ...queueBotStandbyQueueItem.two_line,
            line2: newArtistName,
          },
        },
      ],
    });
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenCalledTimes(4);
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenNthCalledWith(3, {
      type: InternalCommandType.STOP_NEXT,
      data: {
        zone_id,
      },
    });
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenNthCalledWith(4, {
      type: InternalCommandType.STANDBY_NEXT,
      data: {
        zone_id,
      },
    });
    // update its pause action based on settings
    const newPauseAction = "new_queue_bot_stop_track_name";
    settingsListener({
      ...QUEUE_BOT_ENABLED_EXTENSION_SETTINGS,
      nr_queue_bot_pause_track_name: newPauseAction,
    });
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStopQueueItem],
    });
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenCalledTimes(4);
    queueBot.watchQueue({
      zone_id,
      items: [
        {
          ...queueBotStopQueueItem,
          three_line: {
            ...queueBotStopQueueItem.three_line,
            line1: newPauseAction,
          },
        },
      ],
    });
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenCalledTimes(5);
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenNthCalledWith(5, {
      type: InternalCommandType.STOP_NEXT,
      data: {
        zone_id,
      },
    });
    // update its standby action
    const newStandbyAction = "new_queue_bot_standby_track_name";
    settingsListener({
      ...QUEUE_BOT_ENABLED_EXTENSION_SETTINGS,
      nr_queue_bot_standby_track_name: newStandbyAction,
    });
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStandbyQueueItem],
    });
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenCalledTimes(5);
    queueBot.watchQueue({
      zone_id,
      items: [
        {
          ...queueBotStandbyQueueItem,
          three_line: {
            ...queueBotStandbyQueueItem.three_line,
            line1: newStandbyAction,
          },
        },
      ],
    });
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenCalledTimes(6);
    expect(commandDispatcherMock.dispatchInternal).toHaveBeenNthCalledWith(6, {
      type: InternalCommandType.STANDBY_NEXT,
      data: {
        zone_id,
      },
    });
  });

  it("queueBot should do nothing if it has not been started", () => {
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStopQueueItem],
    });
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStandbyQueueItem],
    });
    expect(commandDispatcherMock.dispatchInternal).not.toHaveBeenCalled();
  });

  it("queueBot should do nothing if no settingsManager is available", () => {
    roonMock.settings.mockImplementationOnce(() => {});
    queueBot.start(roonMock);
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStopQueueItem],
    });
    queueBot.watchQueue({
      zone_id,
      items: [queueBotStandbyQueueItem],
    });
    expect(commandDispatcherMock.dispatchInternal).not.toHaveBeenCalled();
  });

  it("queueBot should handle to be started more than once without raising error nor resubscribing to settingsManager onSettings events", () => {
    queueBot.start(roonMock);
    queueBot.start(roonMock);
    queueBot.start(roonMock);
    expect(settingsManager.onSettings).toHaveBeenCalledTimes(1);
  });
});

const QUEUE_BOT_ARTIST_NAME = "queue_bot_artist_name";
const QUEUE_BOT_STOP_TRACK_NAME = "queue_bot_stop_track_name";
const QUEUE_BOT_STANDBY_TRACK_NAME = "queue_bot_stop_standby_name";

const QUEUE_BOT_ENABLED_EXTENSION_SETTINGS: ExtensionSettings = {
  nr_queue_bot_state: "enabled",
  nr_queue_bot_artist_name: QUEUE_BOT_ARTIST_NAME,
  nr_queue_bot_pause_track_name: QUEUE_BOT_STOP_TRACK_NAME,
  nr_queue_bot_standby_track_name: QUEUE_BOT_STANDBY_TRACK_NAME,
};

const zone_id = "zone_id";

const queueBotStopQueueItem: QueueItem = {
  queue_item_id: 424242,
  length: 4242,
  image_key: "not_important",
  one_line: {
    line1: QUEUE_BOT_STOP_TRACK_NAME,
  },
  two_line: {
    line1: QUEUE_BOT_STOP_TRACK_NAME,
    line2: QUEUE_BOT_ARTIST_NAME,
  },
  three_line: {
    line1: QUEUE_BOT_STOP_TRACK_NAME,
    line2: QUEUE_BOT_ARTIST_NAME,
  },
};

const queueBotStandbyQueueItem: QueueItem = {
  queue_item_id: 424242,
  length: 4242,
  image_key: "not_important",
  one_line: {
    line1: QUEUE_BOT_STANDBY_TRACK_NAME,
  },
  two_line: {
    line1: QUEUE_BOT_STANDBY_TRACK_NAME,
    line2: QUEUE_BOT_ARTIST_NAME,
  },
  three_line: {
    line1: QUEUE_BOT_STANDBY_TRACK_NAME,
  },
};
