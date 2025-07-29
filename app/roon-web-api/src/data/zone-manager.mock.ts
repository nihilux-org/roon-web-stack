const zones = vi.fn();
const events = vi.fn();
const start = vi.fn();
const stop = vi.fn();
const isStarted = vi.fn();

export const zoneManagerMock = {
  isStarted,
  start,
  stop,
  events,
  zones,
};

vi.mock("./zone-manager", () => ({
  zoneManager: zoneManagerMock,
}));
