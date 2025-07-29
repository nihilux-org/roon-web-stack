const onServerPaired = vi.fn();
const onServerLost = vi.fn();
const server = vi.fn();
const onZones = vi.fn();
const offZones = vi.fn();
const onOutputs = vi.fn();
const offOutputs = vi.fn();
const startExtension = vi.fn();
const getImage = vi.fn();
const browse = vi.fn();
const load = vi.fn();
const updateSharedConfig = vi.fn();
const sharedConfigEvents = vi.fn();
const settings = vi.fn();

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
  updateSharedConfig,
  sharedConfigEvents,
  settings,
};

vi.mock("./roon-extension", () => ({
  roon: roonMock,
}));
