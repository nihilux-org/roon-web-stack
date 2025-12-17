import { roonMock } from "../../infrastructure/roon-extension.mock";

import { expect, Mock, vi } from "vitest";
import {
  CommandType,
  StartAudioInputCommand,
  StopAudioInputCommand,
  UpdateAudioInputInfoCommand,
} from "@nihilux/roon-web-model";
import { executor } from "./audio-input-command-executor";

describe("audio-input-command-executor.ts test suite", () => {
  let audioInputSessionManagerMock: {
    play: Mock;
    update_track_info: Mock;
    end_session: Mock;
  };
  let settingsManagerMock: {
    settings: Mock;
  };

  beforeEach(() => {
    audioInputSessionManagerMock = {
      play: vi.fn().mockImplementation(() => Promise.resolve()),
      update_track_info: vi.fn().mockImplementation(() => Promise.resolve()),
      end_session: vi.fn().mockImplementation(() => Promise.resolve()),
    };
    roonMock.audioInputSessionManager.mockImplementation(() => audioInputSessionManagerMock);
    settingsManagerMock = {
      settings: vi.fn().mockImplementation(() => ({
        nr_audio_input_stream_url: "stream_url",
      })),
    };
    roonMock.settings.mockImplementation(() => settingsManagerMock);
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("executor should call roon#audioInputSessionManager#play for StartAudioInputCommand", async () => {
    const command: StartAudioInputCommand = {
      type: CommandType.START_AUDIO_INPUT,
      data: {
        zone_id: "zone_id",
      },
    };

    const result = executor(command, roonMock);

    await expect(result).resolves.toBeUndefined();
    expect(audioInputSessionManagerMock.play).toHaveBeenCalledTimes(1);
    expect(audioInputSessionManagerMock.play).toHaveBeenNthCalledWith(1, "zone_id", "stream_url");
  });

  it(
    "executor should not call roon#audioInputSessionManager#play for StartAudioInputCommand " +
      "if no settings has been set for nr_audio_input_stream_url",
    async () => {
      settingsManagerMock.settings.mockImplementation(() => ({}));
      const command: StartAudioInputCommand = {
        type: CommandType.START_AUDIO_INPUT,
        data: {
          zone_id: "zone_id",
        },
      };

      const result = executor(command, roonMock);

      await expect(result).resolves.toBeUndefined();
      expect(audioInputSessionManagerMock.play).toHaveBeenCalledTimes(0);
    }
  );

  it(
    "executor should not call roon#audioInputSessionManager#play for StartAudioInputCommand " +
      "if no audioInputSessionManager is available",
    async () => {
      roonMock.audioInputSessionManager.mockImplementation(() => undefined);
      const command: StartAudioInputCommand = {
        type: CommandType.START_AUDIO_INPUT,
        data: {
          zone_id: "zone_id",
        },
      };

      const result = executor(command, roonMock);

      await expect(result).resolves.toBeUndefined();
      expect(audioInputSessionManagerMock.play).toHaveBeenCalledTimes(0);
    }
  );

  it("executor should call roon#audioInputSessionManager#update_track_info for UpdateAudioInputInfoCommand", async () => {
    const command: UpdateAudioInputInfoCommand = {
      type: CommandType.UPDATE_AUDIO_INPUT_INFO,
      data: {
        zone_id: "zone_id",
        info: {
          is_pause_allowed: false,
          is_seek_allowed: false,
          one_line: {
            line1: "line1",
          },
          two_line: {
            line1: "line1",
            line2: "line2",
          },
          three_line: {
            line1: "line1",
            line2: "line2",
            line3: "line3",
          },
        },
      },
    };

    const result = executor(command, roonMock);

    await expect(result).resolves.toBeUndefined();
    expect(audioInputSessionManagerMock.update_track_info).toHaveBeenCalledTimes(1);
    expect(audioInputSessionManagerMock.update_track_info).toHaveBeenNthCalledWith(
      1,
      command.data.zone_id,
      command.data.info
    );
  });

  it(
    "executor should not call roon#audioInputSessionManager#update_track_info for UpdateAudioInputInfoCommand " +
      "if no audioInputSessionManager is available",
    async () => {
      roonMock.audioInputSessionManager.mockImplementation(() => undefined);
      const command: UpdateAudioInputInfoCommand = {
        type: CommandType.UPDATE_AUDIO_INPUT_INFO,
        data: {
          zone_id: "zone_id",
          info: {
            is_pause_allowed: false,
            is_seek_allowed: false,
            one_line: {
              line1: "line1",
            },
            two_line: {
              line1: "line1",
              line2: "line2",
            },
            three_line: {
              line1: "line1",
              line2: "line2",
              line3: "line3",
            },
          },
        },
      };

      const result = executor(command, roonMock);

      await expect(result).resolves.toBeUndefined();
      expect(audioInputSessionManagerMock.update_track_info).toHaveBeenCalledTimes(0);
    }
  );

  it("executor should call roon#audioInputSessionManager#end_session for StopAudioInputCommand", async () => {
    const command: StopAudioInputCommand = {
      type: CommandType.STOP_AUDIO_INPUT,
      data: {
        zone_id: "zone_id",
      },
    };

    const result = executor(command, roonMock);

    await expect(result).resolves.toBeUndefined();
    expect(audioInputSessionManagerMock.end_session).toHaveBeenCalledTimes(1);
    expect(audioInputSessionManagerMock.end_session).toHaveBeenNthCalledWith(1, command.data.zone_id);
  });

  it(
    "executor should call roon#audioInputSessionManager#end_session for StopAudioInputCommand " +
      "if no audioInputSessionManager is available",
    async () => {
      roonMock.audioInputSessionManager.mockImplementation(() => undefined);
      const command: StopAudioInputCommand = {
        type: CommandType.STOP_AUDIO_INPUT,
        data: {
          zone_id: "zone_id",
        },
      };

      const result = executor(command, roonMock);

      await expect(result).resolves.toBeUndefined();
      expect(audioInputSessionManagerMock.end_session).toHaveBeenCalledTimes(0);
    }
  );
});
