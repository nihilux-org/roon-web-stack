import { Mock, vi } from "vitest";

const start: Mock = vi.fn();
const stream: Mock = vi.fn();
const stop: Mock = vi.fn();
const updateMetadata: Mock = vi.fn();

export interface AirplayServiceMock {
  start: Mock;
  stream: Mock;
  stop: Mock;
  updateMetadata: Mock;
}

export const airplayServiceMock: AirplayServiceMock = {
  start,
  stream,
  stop,
  updateMetadata,
};

vi.mock("./airplay-service", () => ({
  airplayService: airplayServiceMock,
}));
