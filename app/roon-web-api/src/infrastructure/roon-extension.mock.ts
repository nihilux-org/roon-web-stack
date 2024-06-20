const onServerPaired = jest.fn();
const onServerLost = jest.fn();
const server = jest.fn();
const onZones = jest.fn();
const offZones = jest.fn();
const onOutputs = jest.fn();
const offOutputs = jest.fn();
const startExtension = jest.fn();
const getImage = jest.fn();
const browse = jest.fn();
const load = jest.fn();
const saveSharedConfig = jest.fn();
const sharedConfigEvents = jest.fn();

export const roonMock = {
  onServerPaired,
  onServerLost,
  server,
  onZones,
  offZones,
  onOutputs,
  offOutputs,
  startExtension,
  getImage,
  browse,
  load,
  saveSharedConfig,
  sharedConfigEvents,
};

jest.mock("./roon-extension", () => ({
  roon: roonMock,
}));
