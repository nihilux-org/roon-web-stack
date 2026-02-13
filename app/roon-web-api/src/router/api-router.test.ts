import { roonMock } from "../infrastructure/roon-extension.mock";
import { clientManagerMock, clientMock } from "../service/client-manager.mock";

import { Subject } from "rxjs";
import { beforeEach, expect, vi } from "vitest";
import { CommandResult, RoonSseMessage } from "@nihilux/roon-web-model";
import { apiRouter } from "./api-router";

const clientId = "test-client-id";

describe("api-router.ts test suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientManagerMock.register.mockReturnValue(clientId);
  });

  describe("POST /register", () => {
    it("should register a new client without previousClientId", async () => {
      const res = await apiRouter.request("/register", { method: "POST" });

      expect(res.status).toBe(201);
      expect(clientManagerMock.register).toHaveBeenCalledWith(undefined);
      expect(res.headers.get("location")).toBe("/api/test-client-id");
    });

    it("should register a new client with previousClientId", async () => {
      clientManagerMock.register.mockReturnValue(clientId);

      const res = await apiRouter.request(`/register/${clientId}`, { method: "POST" });

      expect(res.status).toBe(201);
      expect(clientManagerMock.register).toHaveBeenCalledWith(clientId);
      expect(res.headers.get("location")).toBe(`/api/${clientId}`);
    });
  });

  describe("GET /version", () => {
    it("should return 204 with version header", async () => {
      const res = await apiRouter.request("/version", { method: "GET" });

      expect(res.status).toBe(204);
      expect(res.headers.get("x-roon-web-stack-version")).toBe(roonMock.extension_version);
    });
  });

  describe("GET /image", () => {
    it("should return 400 when image_key is missing", async () => {
      const res = await apiRouter.request("/image", { method: "GET" });

      expect(res.status).toBe(400);
    });

    it("should return 400 when width is invalid", async () => {
      const res = await apiRouter.request("/image?image_key=abc&width=invalid", { method: "GET" });

      expect(res.status).toBe(400);
    });

    it("should return 400 when height is invalid", async () => {
      const res = await apiRouter.request("/image?image_key=abc&height=invalid", { method: "GET" });

      expect(res.status).toBe(400);
    });

    it("should return 400 when scale is provided without width and height", async () => {
      const res = await apiRouter.request("/image?image_key=abc&scale=fit", { method: "GET" });

      expect(res.status).toBe(400);
    });

    it("should return 200 with image on success", async () => {
      roonMock.getImage.mockResolvedValue({
        content_type: "image/jpeg",
        image: Buffer.from("fake-image-data"),
      });

      const res = await apiRouter.request("/image?image_key=abc123", { method: "GET" });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("image/jpeg");
    });

    it("should return 200 with image with all params for pngs", async () => {
      roonMock.getImage.mockResolvedValue({
        content_type: "image/png",
        image: Buffer.from("fake-image-data"),
      });
      const image_key = "image_key";
      const format = "png";
      const scale = "fit";
      const height = 200;
      const width = 100;

      const res = await apiRouter.request(
        `/image?image_key=${image_key}&width=${width}&height=${height}&scale=${scale}&format=${format}`,
        {
          method: "GET",
        }
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("image/png");
      expect(roonMock.getImage).toHaveBeenCalledWith(image_key, {
        format: "image/png",
        height,
        scale,
        width,
      });
    });

    it("should return 200 with image with all params for jpegs", async () => {
      roonMock.getImage.mockResolvedValue({
        content_type: "image/jpeg",
        image: Buffer.from("fake-image-data"),
      });
      const image_key = "image_key";
      const format = "jpeg";
      const scale = "fit";
      const height = 200;
      const width = 100;

      const res = await apiRouter.request(
        `/image?image_key=${image_key}&width=${width}&height=${height}&scale=${scale}&format=${format}`,
        {
          method: "GET",
        }
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("image/jpeg");
      expect(roonMock.getImage).toHaveBeenCalledWith(image_key, {
        format: "image/jpeg",
        height,
        scale,
        width,
      });
    });

    it("should return 404 when image not found", async () => {
      roonMock.getImage.mockRejectedValue("NotFound");

      const res = await apiRouter.request("/image?image_key=notfound", { method: "GET" });

      expect(res.status).toBe(404);
    });

    it("should return 500 on server error", async () => {
      roonMock.getImage.mockRejectedValue(new Error("Server error"));

      const res = await apiRouter.request("/image?image_key=error", { method: "GET" });

      expect(res.status).toBe(500);
    });
  });

  describe("GET /:clientId/events", () => {
    let events: Subject<RoonSseMessage>;
    let textDecoder: TextDecoder;
    beforeEach(() => {
      events = new Subject();
      textDecoder = new TextDecoder();
    });
    it("should return 403 when client is not found", async () => {
      clientManagerMock.get.mockImplementationOnce(() => {
        throw new Error("error");
      });
      const res = await apiRouter.request("/abc123/events", { method: "GET" });

      expect(res.status).toBe(403);
    });
    it("should stream the events as SSE", async () => {
      clientMock.events.mockImplementation(() => events);

      const response = await apiRouter.request("/test-client/events", { method: "GET" });

      expect(response.headers.get("cache-control")).toEqual("no-cache");
      expect(response.headers.get("content-type")).toEqual("text/event-stream");
      expect(response.headers.get("x-accel-buffering")).toEqual("no");
      const responseStream = response.body;
      expect(responseStream).not.toBeNull();
      const reader = responseStream!.getReader();
      let readPromise = reader.read();
      events.next({
        event: "ping",
        data: { next: 42 },
      });
      let event = await readPromise;
      let eventStrings = textDecoder.decode(event.value as Uint8Array);
      expect(eventStrings).toEqual('event: ping\ndata: {"next":42}\n\n');
      expect(events.observed).toBeTruthy();
      reader.releaseLock();
      readPromise = responseStream!.getReader().read();
      events.next({
        event: "command_state",
        data: {
          command_id: "command_id",
          state: CommandResult.APPLIED,
        },
      });
      event = await readPromise;
      eventStrings = textDecoder.decode(event.value as Uint8Array);
      expect(eventStrings).toEqual('event: command_state\ndata: {"command_id":"command_id","state":"APPLIED"}\n\n');
      expect(events.observed).toBeTruthy();
      reader.releaseLock();
      events.complete();
      expect(events.observed).toBeFalsy();
      expect(clientMock.close).toHaveBeenCalledTimes(0);
    });
  });

  describe("POST /:clientId/unregister", () => {
    it("should return 204 and unregister client", async () => {
      const res = await apiRouter.request("/test-client/unregister", { method: "POST" });

      expect(res.status).toBe(204);
      expect(clientManagerMock.unregister).toHaveBeenCalledWith("test-client");
    });
  });

  describe("POST /:clientId/command", () => {
    it("should return 202 with command_id", async () => {
      const command_id = "test-command-id";
      clientMock.command.mockImplementationOnce(() => command_id);
      const command = { command: "play" };
      const res = await apiRouter.request("/test-client/command", {
        method: "POST",
        body: JSON.stringify(command),
      });

      expect(res.status).toBe(202);
      expect(await res.json()).toEqual({ command_id });
      expect(clientMock.command).toHaveBeenCalledWith(command);
    });
  });

  describe("POST /:clientId/browse", () => {
    it("should return browse response", async () => {
      const browseOptions = { hierarchy: "browse" };
      const browseResponse = {
        browse: "test_response",
      };
      clientMock.browse.mockImplementationOnce(() => browseResponse);
      const res = await apiRouter.request("/test-client/browse", {
        method: "POST",
        body: JSON.stringify(browseOptions),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(browseResponse);
      expect(clientMock.browse).toHaveBeenCalledWith(browseOptions);
    });
  });

  describe("POST /:clientId/load", () => {
    it("should return laod response", async () => {
      const loadOptions = { load: "options" };
      const loadResponse = {
        load: "test_response",
      };
      clientMock.load.mockImplementationOnce(() => loadResponse);

      const res = await apiRouter.request("/test-client/load", {
        method: "POST",
        body: JSON.stringify(loadOptions),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(loadResponse);
      expect(clientMock.load).toHaveBeenCalledWith(loadOptions);
    });
  });
});
