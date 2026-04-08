import { loggerMock } from "@mock";
import { airplayManagerMock } from "../data/airplay-manager.mock";
import { roonMock } from "../infrastructure/roon-extension.mock";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MissingImageError } from "@nihilux/roon-web-model";
import { imageFetcher } from "./image-fetcher";

describe("image-fetcher.ts test suite", () => {
  const options = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("airplay image", () => {
    it("should return airplay image when key matches and image is available", async () => {
      airplayManagerMock.isAirplayImageKey.mockReturnValue(true);
      airplayManagerMock.image = {
        data: new Uint8Array([0xff, 0xd8]),
        contentType: "image/jpeg",
        image_key: "airplay_image_key_1",
      };

      const result = await imageFetcher.fetch("airplay_image_key_1", options);

      expect(result).toEqual({
        data: new Uint8Array([0xff, 0xd8]),
        contentType: "image/jpeg",
        image_key: "airplay_image_key_1",
        cacheable: false,
      });
    });

    it("should throw MissingImageError when key matches but no image is available", async () => {
      airplayManagerMock.isAirplayImageKey.mockReturnValue(true);
      airplayManagerMock.image = undefined;

      await expect(imageFetcher.fetch("airplay_image_key_2", options)).rejects.toThrow(MissingImageError);
      await expect(imageFetcher.fetch("airplay_image_key_2", options)).rejects.toThrow("no airplay image");

      try {
        await imageFetcher.fetch("airplay_image_key_2", options);
      } catch (err: unknown) {
        expect((err as MissingImageError).cacheable).toBe(false);
      }
    });
  });

  describe("roon image", () => {
    it("should return roon image when key does not match airplay", async () => {
      airplayManagerMock.isAirplayImageKey.mockReturnValue(false);
      roonMock.getImage.mockResolvedValue({
        content_type: "image/png",
        image: new Uint8Array([0x89, 0x50]),
      });

      const result = await imageFetcher.fetch("roon_image_key", options);

      expect(result).toEqual({
        data: new Uint8Array([0x89, 0x50]),
        contentType: "image/png",
        cacheable: false,
      });
    });

    it("should throw MissingImageError with cacheable=true when roon returns NotFound", async () => {
      airplayManagerMock.isAirplayImageKey.mockReturnValue(false);
      roonMock.getImage.mockRejectedValue("NotFound");

      await expect(imageFetcher.fetch("missing_key", options)).rejects.toThrow(MissingImageError);
      await expect(imageFetcher.fetch("missing_key", options)).rejects.toThrow("missing_key not found");

      try {
        await imageFetcher.fetch("missing_key", options);
      } catch (err: unknown) {
        expect((err as MissingImageError).cacheable).toBe(true);
      }
    });

    it("should throw original error and log when roon returns unexpected error", async () => {
      airplayManagerMock.isAirplayImageKey.mockReturnValue(false);
      const unexpectedError = new Error("unexpected");
      roonMock.getImage.mockRejectedValue(unexpectedError);

      await expect(imageFetcher.fetch("error_key", options)).rejects.toThrow("unexpected");
      expect(loggerMock.error).toHaveBeenCalledWith(unexpectedError, "image can't be fetched from roon");
    });
  });
});
