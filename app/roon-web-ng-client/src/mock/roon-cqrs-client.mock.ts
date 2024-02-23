const start = jest.fn();
const client_stop = jest.fn();
const onRoonState = jest.fn();
const offRoonState = jest.fn();
const onCommandState = jest.fn();
const offCommandState = jest.fn();
const onZoneState = jest.fn();
const offZoneState = jest.fn();
const onQueueState = jest.fn();
const offQueueState = jest.fn();
const command = jest.fn();

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

const build = jest.fn().mockImplementation(() => roonCqrsClientMock);

export const roonWebClientFactoryMock = {
  build,
};

jest.mock("@nihilux/roon-web-client", () => ({
  roonWebClientFactory: roonWebClientFactoryMock,
}));
