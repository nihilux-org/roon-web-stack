const events = vi.fn();
const close = vi.fn();
const command = vi.fn();
const browse = vi.fn();
const load = vi.fn();

export const clientMock = {
  events,
  close,
  command,
  browse,
  load,
};

const register = vi.fn();
const unregister = vi.fn();
const get = vi.fn().mockImplementation((_) => clientMock);
const start = vi.fn();
const stop = vi.fn();

export const clientManagerMock = {
  register,
  unregister,
  get,
  start,
  stop,
};

vi.mock("./client-manager", () => ({
  clientManager: clientManagerMock,
}));
