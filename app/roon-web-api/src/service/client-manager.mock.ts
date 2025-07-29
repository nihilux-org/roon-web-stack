const register = vi.fn();
const unregister = vi.fn();
const get = vi.fn();
const start = vi.fn();
const stop = vi.fn();
const browse = vi.fn();
const load = vi.fn();

export const clientManagerMock = {
  register,
  unregister,
  get,
  start,
  stop,
  browse,
  load,
};

vi.mock("./client-manager", () => ({
  clientManager: clientManagerMock,
}));
