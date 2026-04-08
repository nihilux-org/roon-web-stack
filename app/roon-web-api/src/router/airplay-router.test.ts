import { airplayManagerMock } from "../data/airplay-manager.mock";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { airplayRouter } from "./airplay-router";

describe("airplay-router.ts test suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    airplayManagerMock.image = undefined;
    airplayManagerMock.stop.mockResolvedValue(undefined);
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
      expect(airplayManagerMock.start).toHaveBeenCalledTimes(1);
      expect(airplayManagerMock.start).toHaveBeenCalledWith(airplayStreamUrl);
    });

    it("should do nothing and return 204 with empty body when missing x-roon-airplay-stream-url header", async () => {
      const res = await airplayRouter.request("/", { method: "POST" });

      expect(res.status).toBe(204);
      expect(res.body).toBeNull();
      expect(airplayManagerMock.start).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /", () => {
    it("should call stop and return 204", async () => {
      const res = await airplayRouter.request("/", { method: "DELETE" });

      expect(res.status).toBe(204);
      expect(airplayManagerMock.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe("PUT /metadata", () => {
    it("should call updateMetadata and return 204 when metadata is valid", async () => {
      airplayManagerMock.updateMetadata.mockResolvedValue(undefined);

      const res = await airplayRouter.request("/metadata", {
        method: "PUT",
        body: JSON.stringify({ artist: "Test Artist", album: "Test Album", title: "Test Title" }),
      });

      expect(res.status).toBe(204);
      expect(airplayManagerMock.updateMetadata).toHaveBeenCalledTimes(1);
      expect(airplayManagerMock.updateMetadata).toHaveBeenCalledWith({
        artist: "Test Artist",
        album: "Test Album",
        title: "Test Title",
      });
    });
  });

  describe("PUT /image", () => {
    it("should call setImage and return 204", async () => {
      const body = new Uint8Array([1, 2, 3]);

      const res = await airplayRouter.request("/image", {
        method: "PUT",
        body: body,
        headers: {
          "Content-Type": "image/png",
        },
      });

      expect(res.status).toBe(204);
      expect(airplayManagerMock.image).toEqual({
        data: body,
        contentType: "image/png",
      });
    });

    it("should return 400 when body is empty", async () => {
      const res = await airplayRouter.request("/image", {
        method: "PUT",
        body: new Uint8Array(0),
      });

      expect(res.status).toBe(400);
      expect(airplayManagerMock.image).toBeUndefined();
    });

    it("should default to image/jpeg when Content-Type header is missing", async () => {
      const body = new Uint8Array([1, 2, 3]);

      const res = await airplayRouter.request("/image", {
        method: "PUT",
        body: body,
      });

      expect(res.status).toBe(204);
      expect(airplayManagerMock.image).toEqual({
        data: body,
        contentType: "image/jpeg",
      });
    });
  });
});
