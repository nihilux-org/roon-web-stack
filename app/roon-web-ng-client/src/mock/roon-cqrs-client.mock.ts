import { vi } from "vitest";

const start = vi.fn();
const client_stop = vi.fn();
const onRoonState = vi.fn();
const offRoonState = vi.fn();
const onCommandState = vi.fn();
const offCommandState = vi.fn();
const onZoneState = vi.fn();
const offZoneState = vi.fn();
const onQueueState = vi.fn();
const offQueueState = vi.fn();
const command = vi.fn();

export const roonCqrsClientMock = {
  start,
  stop: client_stop,
  onRoonState,
  offRoonState,
  onCommandState,
  offCommandState,
  onZoneState,
  offZoneState,
  onQueueState,
  offQueueState,
  command,
};

const build = vi.fn().mockImplementation(() => roonCqrsClientMock);

export const roonWebClientFactoryMock = {
  build,
};

vi.mock("@nihilux/roon-web-client", () => ({
  roonWebClientFactory: roonWebClientFactoryMock,
}));
