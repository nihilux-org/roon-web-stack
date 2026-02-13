import { Mock } from "vitest";

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
const audioInputSessionManager = vi.fn();

export interface RoonMock {
  onServerPaired: Mock;
  onServerLost: Mock;
  server: Mock;
  onZones: Mock;
  offZones: Mock;
  onOutputs: Mock;
  offOutputs: Mock;
  startExtension: Mock;
  getImage: Mock;
  browse: Mock;
  load: Mock;
  updateSharedConfig: Mock;
  sharedConfigEvents: Mock;
  settings: Mock;
  audioInputSessionManager: Mock;
  extension_version: string;
}

export const roonMock: RoonMock = {
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
  audioInputSessionManager,
  extension_version: "to_replace",
};

vi.mock("./roon-extension", async (importOriginal) => {
  const roonExtension: { extension_version: string } = await importOriginal();
  roonMock.extension_version = roonExtension.extension_version;
  return {
    roon: roonMock,
    extension_version: roonExtension.extension_version,
  };
});
