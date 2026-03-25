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
    it("should return 201 with Location header when start succeeds", async () => {
      airplayServiceMock.start.mockResolvedValue("http://test-host:42/airplay");

      const res = await airplayRouter.request("/", { method: "POST" });

      expect(res.status).toBe(204);
      expect(airplayServiceMock.start).toHaveBeenCalledTimes(1);
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
