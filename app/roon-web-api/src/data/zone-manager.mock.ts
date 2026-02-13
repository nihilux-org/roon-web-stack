import { Mock } from "vitest";

const zones: Mock = vi.fn();
const events: Mock = vi.fn();
const start: Mock = vi.fn();
const stop: Mock = vi.fn();
const isStarted: Mock = vi.fn();

export interface ZoneManagerMock {
  isStarted: Mock;
  start: Mock;
  stop: Mock;
  events: Mock;
  zones: Mock;
}

export const zoneManagerMock: ZoneManagerMock = {
  isStarted,
  start,
  stop,
  events,
  zones,
};

vi.mock("./zone-manager", () => ({
  zoneManager: zoneManagerMock,
}));
