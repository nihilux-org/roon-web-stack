import { airplayServiceMock } from "../service/airplay-service.mock";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { airplayRouter } from "./airplay-router";

describe("airplay-router.ts test suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    airplayServiceMock.stop.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /", () => {
    it("should return 204 with empty body when start succeeds", async () => {
      const airplayStreamUrl = "airplay_stream_url";

      const res = await airplayRouter.request("/", {
        method: "POST",
        headers: {
          "x-roon-airplay-stream-url": airplayStreamUrl,
        },
      });

      expect(res.status).toBe(204);
      expect(res.body).toBeNull();
      expect(airplayServiceMock.start).toHaveBeenCalledTimes(1);
      expect(airplayServiceMock.start).toHaveBeenCalledWith(airplayStreamUrl);
    });

    it("should do nothing and return 204 with empty body when missing x-roon-airplay-stream-url header", async () => {
      const res = await airplayRouter.request("/", { method: "POST" });

      expect(res.status).toBe(204);
      expect(res.body).toBeNull();
      expect(airplayServiceMock.start).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /", () => {
    it("should call stop and return 204", async () => {
      const res = await airplayRouter.request("/", { method: "DELETE" });

      expect(res.status).toBe(204);
      expect(airplayServiceMock.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe("PUT /metadata", () => {
    it("should call updateMetadata and return 204 when metadata is valid", async () => {
      airplayServiceMock.updateMetadata.mockResolvedValue(undefined);

      const res = await airplayRouter.request("/metadata", {
        method: "PUT",
        body: JSON.stringify({ artist: "Test Artist", album: "Test Album", title: "Test Title" }),
      });

      expect(res.status).toBe(204);
      expect(airplayServiceMock.updateMetadata).toHaveBeenCalledTimes(1);
      expect(airplayServiceMock.updateMetadata).toHaveBeenCalledWith({
        artist: "Test Artist",
        album: "Test Album",
        title: "Test Title",
      });
    });
  });
});
