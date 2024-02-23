const zones = jest.fn();
const events = jest.fn();
const start = jest.fn();
const stop = jest.fn();
const isStarted = jest.fn();

export const zoneManagerMock = {
  isStarted,
  start,
  stop,
  events,
  zones,
};

jest.mock("./zone-manager", () => ({
  zoneManager: zoneManagerMock,
}));
