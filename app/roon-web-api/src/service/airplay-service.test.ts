import { loggerMock } from "@mock";
import { roonMock } from "../infrastructure/roon-extension.mock";

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { AirplayService, ExtensionSettings } from "@nihilux/roon-web-model";

describe("airplay-service.ts test suite", () => {
  let airplayService: AirplayService;
  let audioInputSessionManagerMock: {
    play: Mock;
    end_session: Mock;
    update_track_info: Mock;
  };
  let settingsManagerMock: {
    settings: Mock;
    updateSettings: Mock;
    onSettings: Mock;
    offSettings: Mock;
  };

  beforeEach(async () => {
    settingsManagerMock = {
      settings: vi.fn().mockReturnValue({
        nr_airplay_state: "enabled",
        nr_airplay_zone: "test_zone_id",
        nr_airplay_stream_url: "http://test-host:42/airplay",
        nr_audio_input_zones: [],
        nr_audio_input_default_zone: "",
        nr_audio_input_state: "disabled",
        nr_audio_input_stream_url: "",
        nr_airplay_zones: [],
        nr_queue_bot_state: "disabled",
        nr_queue_bot_standby_track_name: "",
        nr_queue_bot_artist_name: "",
        nr_queue_bot_pause_track_name: "",
      } as ExtensionSettings),
      updateSettings: vi.fn(),
      onSettings: vi.fn(),
      offSettings: vi.fn(),
    };
    audioInputSessionManagerMock = {
      play: vi.fn().mockResolvedValue(undefined),
      end_session: vi.fn().mockResolvedValue(undefined),
      update_track_info: vi.fn().mockResolvedValue(undefined),
    };

    roonMock.settings.mockReturnValue(settingsManagerMock);
    roonMock.audioInputSessionManager.mockReturnValue(audioInputSessionManagerMock);

    airplayService = ((await import("./airplay-service")) as { airplayService: AirplayService }).airplayService;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should return stream URL when start is called", async () => {
    const airplay_stream_url = "http://test-host:42/airplay";

    await airplayService.start(airplay_stream_url);

    expect(audioInputSessionManagerMock.play).toHaveBeenCalledWith("test_zone_id", airplay_stream_url, "Roon Airplay", {
      is_pause_allowed: false,
      is_seek_allowed: false,
      one_line: {
        line1: "Roon Airplay",
      },
      two_line: {
        line1: "Roon Airplay",
      },
      three_line: {
        line1: "Roon Airplay",
      },
    });
    await airplayService.stop();
  });

  it("should do nothing when airplay is disabled ans start is called", async () => {
    settingsManagerMock.settings.mockReturnValue({
      nr_airplay_state: "disabled",
      nr_airplay_zone: "",
    } as ExtensionSettings);
    const airplay_stream_url = "http://test-host:42/airplay";

    await airplayService.start(airplay_stream_url);

    expect(audioInputSessionManagerMock.play).not.toHaveBeenCalled();
  });

  it("should do nothing when airplay is disabled and stop is called", async () => {
    settingsManagerMock.settings.mockReturnValue({
      nr_airplay_state: "disabled",
      nr_airplay_zone: "",
    } as ExtensionSettings);

    await expect(airplayService.stop()).resolves.toBeUndefined();
    expect(audioInputSessionManagerMock.end_session).not.toHaveBeenCalled();
  });

  describe("updateMetadata", () => {
    it("should call update_track_info with correct RoonAudioInputTrackInfo when all metadata provided", async () => {
      await airplayService.updateMetadata({ artist: "Test Artist", album: "Test Album", title: "Test Title" });

      expect(audioInputSessionManagerMock.update_track_info).toHaveBeenCalledWith("test_zone_id", {
        is_seek_allowed: false,
        is_pause_allowed: false,
        one_line: { line1: "Test Title" },
        two_line: { line1: "Test Title", line2: "Test Artist" },
        three_line: { line1: "Test Title", line2: "Test Artist", line3: "Test Album" },
        track_id: "Test Artist_Test Album_Test Title",
      });
    });

    it("should call update_track_info with optional fields undefined when partial metadata provided", async () => {
      await airplayService.updateMetadata({ title: "Only Title" });

      expect(audioInputSessionManagerMock.update_track_info).toHaveBeenCalledWith("test_zone_id", {
        is_seek_allowed: false,
        is_pause_allowed: false,
        one_line: { line1: "Only Title" },
        two_line: { line1: "Only Title", line2: "" },
        three_line: { line1: "Only Title", line2: "", line3: "" },
        track_id: "undefined_undefined_Only Title",
      });
    });

    it("should use empty string for title fallback when only Artist provided", async () => {
      await airplayService.updateMetadata({ artist: "Only Artist" });

      expect(audioInputSessionManagerMock.update_track_info).toHaveBeenCalledWith("test_zone_id", {
        is_seek_allowed: false,
        is_pause_allowed: false,
        one_line: { line1: "" },
        two_line: { line1: "", line2: "Only Artist" },
        three_line: { line1: "", line2: "Only Artist", line3: "" },
        track_id: "Only Artist_undefined_undefined",
      });
    });

    it("should do nothing when airplay is disabled", async () => {
      settingsManagerMock.settings.mockReturnValue({
        nr_airplay_state: "disabled",
        nr_airplay_zone: "",
      } as ExtensionSettings);

      await airplayService.updateMetadata({ artist: "Test Artist", album: "Test Album", title: "Test Title" });

      expect(audioInputSessionManagerMock.update_track_info).not.toHaveBeenCalled();
    });

    it("should do nothing when all metadata fields are empty", async () => {
      await airplayService.updateMetadata({});

      expect(audioInputSessionManagerMock.update_track_info).not.toHaveBeenCalled();
    });

    it("should swallow any roon API error log error", async () => {
      const error = new Error("error");
      audioInputSessionManagerMock.update_track_info.mockRejectedValue(error);

      await airplayService.updateMetadata({ artist: "Test Artist", album: "Test Album", title: "Test Title" });

      expect(audioInputSessionManagerMock.update_track_info).toHaveBeenCalled();
      expect(loggerMock.debug).toHaveBeenCalledWith(error, "error in roon API call update_track_info");
    });
  });
});
