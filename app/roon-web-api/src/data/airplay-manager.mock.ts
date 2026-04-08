import { Mock, vi } from "vitest";
import { AirplayImage } from "@nihilux/roon-web-model";

const isAirplayZone: Mock = vi.fn();
const start: Mock = vi.fn();
const stop: Mock = vi.fn();
const updateMetadata: Mock = vi.fn();
const isAirplayImageKey: Mock = vi.fn();

export interface AirplayManagerMock {
  isAirplayZone: Mock;
  isAirplayImageKey: Mock;
  image: AirplayImage | undefined;
  start: Mock;
  stop: Mock;
  updateMetadata: Mock;
}

export const airplayManagerMock: AirplayManagerMock = {
  isAirplayZone,
  isAirplayImageKey,
  start,
  stop,
  updateMetadata,
  image: undefined,
};

vi.mock("./airplay-manager", () => ({
  airplayManager: airplayManagerMock,
}));
