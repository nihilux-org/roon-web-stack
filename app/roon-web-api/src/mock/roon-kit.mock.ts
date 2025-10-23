const on = vi.fn();
const off = vi.fn();
const get_core = vi.fn();
const set_status = vi.fn();
const start_discovery = vi.fn();
const save_config = vi.fn();
const load_config = vi.fn();
const api = () => ({
  save_config,
  load_config,
});
const settings = vi.fn();
export const extensionMock = {
  on,
  off,
  set_status,
  get_core,
  start_discovery,
  api,
  settings,
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
      }
    ),
  };
});
