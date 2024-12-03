const on = jest.fn();
const off = jest.fn();
const get_core = jest.fn();
const set_status = jest.fn();
const start_discovery = jest.fn();
const save_config = jest.fn();
const load_config = jest.fn();
const api = () => ({
  save_config,
  load_config,
});
const settings = jest.fn();
export const extensionMock = {
  on,
  off,
  set_status,
  get_core,
  start_discovery,
  api,
  settings,
};

jest.mock(
  "@roon-kit",
  () =>
    ({
      ...jest.requireActual("@roon-kit"),
      Extension: jest.fn().mockImplementation(() => extensionMock),
    }) as unknown
);
