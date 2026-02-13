import { Mock, vi } from "vitest";

const on: Mock = vi.fn();
const off: Mock = vi.fn();
const get_core: Mock = vi.fn();
const set_status: Mock = vi.fn();
const start_discovery: Mock = vi.fn();
const save_config: Mock = vi.fn();
const load_config: Mock = vi.fn();
const api = () => ({
  save_config,
  load_config,
});
const settings: Mock = vi.fn();
const audioInputSessionManager: Mock = vi.fn();

export interface ExtensionMock {
  on: Mock;
  off: Mock;
  set_status: Mock;
  get_core: Mock;
  start_discovery: Mock;
  api: () => { save_config: Mock; load_config: Mock };
  settings: Mock;
  audioInputSessionManager: Mock;
}

export const extensionMock: ExtensionMock = {
  on,
  off,
  set_status,
  get_core,
  start_discovery,
  api,
  settings,
  audioInputSessionManager,
};

vi.mock("@roon-kit", async () => {
  const roonKitModule = await vi.importActual("@roon-kit");
  return {
    ...roonKitModule,
    Extension: vi.fn(
      class {
        on = on;
        off = off;
        set_status = set_status;
        get_core = get_core;
        start_discovery = start_discovery;
        api = api;
        settings = settings;
        audioInputSessionManager = audioInputSessionManager;
      }
    ),
  };
});
