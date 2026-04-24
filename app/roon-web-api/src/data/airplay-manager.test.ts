import { loggerMock } from "@mock";
import { roonMock } from "../infrastructure/roon-extension.mock";

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { AirplayManager } from "@nihilux/roon-web-model";

describe("airplay-manager.ts test suite", () => {
  const test_zone_id = "test_zone_id";
  let airplayManager: AirplayManager;
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
        nr_airplay_zone: test_zone_id,
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
      }),
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

    airplayManager = ((await import("./airplay-manager")) as { airplayManager: AirplayManager }).airplayManager;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should return stream URL when start is called", async () => {
    const airplay_stream_url = "http://test-host:42/airplay";

    await airplayManager.start(airplay_stream_url);

    expect(audioInputSessionManagerMock.play).toHaveBeenCalledWith(test_zone_id, airplay_stream_url, "Roon Airplay", {
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
    await airplayManager.stop();
  });

  it("should do nothing when airplay is disabled ans start is called", async () => {
    settingsManagerMock.settings.mockReturnValue({
      nr_airplay_state: "disabled",
      nr_airplay_zone: "",
    });
    const airplay_stream_url = "http://test-host:42/airplay";

    await airplayManager.start(airplay_stream_url);

    expect(audioInputSessionManagerMock.play).not.toHaveBeenCalled();
  });

  it("should do nothing when airplay is disabled and stop is called", async () => {
    settingsManagerMock.settings.mockReturnValue({
      nr_airplay_state: "disabled",
      nr_airplay_zone: "",
    });

    await expect(airplayManager.stop()).resolves.toBeUndefined();
    expect(audioInputSessionManagerMock.end_session).not.toHaveBeenCalled();
  });

  describe("isAirplayZone", () => {
    it("should return false if no ongoing airplay session", () => {
      expect(airplayManager.isAirplayZone(test_zone_id)).toBe(false);
    });

    it("should return false if called for a zone that is not the airplay zone", async () => {
      const airplay_stream_url = "http://test-host:42/airplay";
      await airplayManager.start(airplay_stream_url);

      expect(airplayManager.isAirplayZone("wrong_zone_id")).toBe(false);

      await airplayManager.stop();
    });

    it("should return true if called with the airplay zone and an airplay session is ongoing", async () => {
      const airplay_stream_url = "http://test-host:42/airplay";
      await airplayManager.start(airplay_stream_url);

      expect(airplayManager.isAirplayZone(test_zone_id)).toBe(true);

      await airplayManager.stop();
    });
  });

  describe("updateMetadata", () => {
    it("should call update_track_info with correct RoonAudioInputTrackInfo when all metadata provided", async () => {
      await airplayManager.updateMetadata({ artist: "Test Artist", album: "Test Album", title: "Test Title" });

      expect(audioInputSessionManagerMock.update_track_info).toHaveBeenCalledWith(test_zone_id, {
        is_seek_allowed: false,
        is_pause_allowed: false,
        one_line: { line1: "Test Title" },
        two_line: { line1: "Test Title", line2: "Test Artist" },
        three_line: { line1: "Test Title", line2: "Test Artist", line3: "Test Album" },
        track_id: "Test Artist_Test Album_Test Title",
      });
    });

    it("should call update_track_info with optional fields undefined when partial metadata provided", async () => {
      await airplayManager.updateMetadata({ title: "Only Title" });

      expect(audioInputSessionManagerMock.update_track_info).toHaveBeenCalledWith(test_zone_id, {
        is_seek_allowed: false,
        is_pause_allowed: false,
        one_line: { line1: "Only Title" },
        two_line: { line1: "Only Title", line2: "" },
        three_line: { line1: "Only Title", line2: "", line3: "" },
        track_id: "undefined_undefined_Only Title",
      });
    });

    it("should use empty string for title fallback when only Artist provided", async () => {
      await airplayManager.updateMetadata({ artist: "Only Artist" });

      expect(audioInputSessionManagerMock.update_track_info).toHaveBeenCalledWith(test_zone_id, {
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
      });

      await airplayManager.updateMetadata({ artist: "Test Artist", album: "Test Album", title: "Test Title" });

      expect(audioInputSessionManagerMock.update_track_info).not.toHaveBeenCalled();
    });

    it("should do nothing when all metadata fields are empty", async () => {
      await airplayManager.updateMetadata({});

      expect(audioInputSessionManagerMock.update_track_info).not.toHaveBeenCalled();
    });

    it("should swallow any roon API error log error", async () => {
      const error = new Error("error");
      audioInputSessionManagerMock.update_track_info.mockRejectedValue(error);

      await airplayManager.updateMetadata({ artist: "Test Artist", album: "Test Album", title: "Test Title" });

      expect(audioInputSessionManagerMock.update_track_info).toHaveBeenCalled();
      expect(loggerMock.debug).toHaveBeenCalledWith(error, "error in roon API call update_track_info");
    });
  });

  describe("image", () => {
    it("should not store image when image setter is called without an ongoing airplay session", () => {
      const data = new Uint8Array([1, 2, 3]);

      airplayManager.image = { data, contentType: "image/jpeg" };

      const result = airplayManager.image;
      expect(result).toBeUndefined();
    });
    it("should store image when image setter is called with an ongoing airplay session", async () => {
      await airplayManager.start("stream_url");
      const data = new Uint8Array([1, 2, 3]);

      airplayManager.image = { data, contentType: "image/jpeg" };

      const result = airplayManager.image;

      expect(result).toBeDefined();
      expect(result.data).toBe(data);
      expect(result.contentType).toBe("image/jpeg");
    });

    it("should return undefined when image getter is called without being set", () => {
      expect(airplayManager.image).toBeUndefined();
    });

    it("should delete the image if setter called with undefined during an airplay session", async () => {
      await airplayManager.start("stream_url");
      const data = new Uint8Array([1, 2, 3]);
      airplayManager.image = { data, contentType: "image/jpeg" };

      airplayManager.image = undefined;
      expect(airplayManager.image).toBeUndefined();
    });

    it("should clear image when stop is called", async () => {
      const airplay_stream_url = "http://test-host:42/airplay";
      await airplayManager.start(airplay_stream_url);
      airplayManager.image = { data: new Uint8Array([1, 2, 3]), contentType: "image/jpeg" };

      await airplayManager.stop();

      expect(airplayManager.image).toBeUndefined();
    });

    it("should clear image when start is called", async () => {
      const airplay_stream_url = "http://test-host:42/airplay";
      airplayManager.image = { data: new Uint8Array([1, 2, 3]), contentType: "image/jpeg" };

      await airplayManager.start(airplay_stream_url);

      expect(airplayManager.image).toBeUndefined();
    });
  });

  describe("transferAirplayZone", () => {
    it("should call stop then start with new zone_id when transferring airplay zone", async () => {
      const airplay_stream_url = "http://test-host:42/airplay";
      await airplayManager.start(airplay_stream_url);

      await airplayManager.transferAirplayZone("new_zone_id");

      expect(audioInputSessionManagerMock.end_session).toHaveBeenCalledWith(test_zone_id);
      expect(audioInputSessionManagerMock.play).toHaveBeenCalledWith(
        "new_zone_id",
        airplay_stream_url,
        "Roon Airplay",
        {
          is_pause_allowed: false,
          is_seek_allowed: false,
          one_line: { line1: "Roon Airplay" },
          two_line: { line1: "Roon Airplay" },
          three_line: { line1: "Roon Airplay" },
        }
      );
      await airplayManager.stop();
    });

    it("should do nothing when airplay is disabled", async () => {
      settingsManagerMock.settings.mockReturnValue({
        nr_airplay_state: "disabled",
        nr_airplay_zone: "",
      });

      await airplayManager.transferAirplayZone("new_zone_id");

      expect(audioInputSessionManagerMock.end_session).not.toHaveBeenCalled();
      expect(audioInputSessionManagerMock.play).not.toHaveBeenCalled();
    });

    it("should do nothing when no active airplay session", async () => {
      await airplayManager.transferAirplayZone("new_zone_id");

      expect(audioInputSessionManagerMock.end_session).not.toHaveBeenCalled();
      expect(audioInputSessionManagerMock.play).not.toHaveBeenCalled();
    });

    it("should do nothing when new zone_id is same as current zone_id", async () => {
      const airplay_stream_url = "http://test-host:42/airplay";
      await airplayManager.start(airplay_stream_url);

      await airplayManager.transferAirplayZone(test_zone_id);

      expect(audioInputSessionManagerMock.end_session).not.toHaveBeenCalled();
      expect(audioInputSessionManagerMock.play).toHaveBeenCalledTimes(1);
      await airplayManager.stop();
    });
  });

  describe("isAirplayImageKey", () => {
    it("should return true for image keys starting with 'airplay_image'", () => {
      expect(airplayManager.isAirplayImageKey("airplay_image_1")).toBe(true);
    });

    it("should return true for 'airplay_image' prefix without suffix", () => {
      expect(airplayManager.isAirplayImageKey("airplay_image")).toBe(true);
    });

    it("should return false for non-airplay image keys", () => {
      expect(airplayManager.isAirplayImageKey("other_image_1")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(airplayManager.isAirplayImageKey("")).toBe(false);
    });
  });
});
