import { Hono } from "hono";

vi.mock("./app-router", () => ({
  appRouter: new Hono()
    .get("/", (c) => c.html("<html></html>", 200))
    .get("/*", (c) => {
      const path = c.req.path;
      if (path.endsWith(".js") || path.endsWith(".css")) {
        return c.body("asset", 200);
      }
      return c.body(null, 404);
    }),
}));

import { loggerMock } from "@mock";
import { roonMock } from "../infrastructure/roon-extension.mock";
import { clientManagerMock } from "../service/client-manager.mock";

import { beforeEach, describe, expect } from "vitest";
import "../mock/pino.mock";
import { roonWebApiRouter } from "./index";

const clientId = "test-client-id";

describe("roonWebApiRouter test suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientManagerMock.register.mockReturnValue(clientId);
  });

  describe("route mounting", () => {
    it("should delegate /api/* routes to apiRouter", async () => {
      const res = await roonWebApiRouter.request("/api/version", { method: "GET" });

      expect(res.status).toBe(204);
      expect(res.headers.get("x-roon-web-stack-version")).toBe(roonMock.extension_version);
    });

    it("should delegate /api/register to apiRouter", async () => {
      const res = await roonWebApiRouter.request("/api/register", { method: "POST" });

      expect(res.status).toBe(201);
      expect(res.headers.get("location")).toBe(`/api/${clientId}`);
    });
  });

  describe("error handling", () => {
    it("should return 403 when client is not found", async () => {
      clientManagerMock.get.mockImplementationOnce(() => {
        throw new Error("Client not found");
      });

      const res = await roonWebApiRouter.request("/api/test-client/command", {
        method: "POST",
        body: JSON.stringify({ command: "play" }),
      });

      expect(res.status).toBe(403);
    });
  });

  describe("not found", () => {
    it("should return 404 for unmatched routes outside static files", async () => {
      const res = await roonWebApiRouter.request("/nonexistent-path.xyz", { method: "GET" });

      expect(res.status).toBe(404);
    });

    it("should return 404 for unmatched POST routes", async () => {
      const res = await roonWebApiRouter.request("/unknown-endpoint", { method: "POST" });

      expect(res.status).toBe(404);
    });
  });

  describe("request logging", () => {
    it("should log request completion with debug level", async () => {
      await roonWebApiRouter.request("/api/version", { method: "GET" });

      expect(loggerMock.debug).toHaveBeenCalled();
      const debugCall = loggerMock.debug.mock.calls[0];
      const logData = debugCall[0] as { method: string; path: string; status: number; duration: string };
      expect(logData.method).toBe("GET");
      expect(logData.path).toBe("/api/version");
      expect(logData.status).toBe(204);
      expect(logData.duration).toMatch(/^\d+ms$/);
    });
  });

  describe("compression", () => {
    it("should handle compression middleware without error", async () => {
      const largeImage = Buffer.alloc(2000, "x");
      roonMock.getImage.mockResolvedValue({
        content_type: "image/jpeg",
        image: largeImage,
      });

      const res = await roonWebApiRouter.request("/api/image?image_key=large", {
        method: "GET",
        headers: { "Accept-Encoding": "gzip" },
      });

      expect(res.status).toBe(200);
    });
  });
});
