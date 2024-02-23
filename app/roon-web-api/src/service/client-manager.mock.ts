const register = jest.fn();
const unregister = jest.fn();
const get = jest.fn();
const start = jest.fn();
const stop = jest.fn();
const browse = jest.fn();
const load = jest.fn();

export const clientManagerMock = {
  register,
  unregister,
  get,
  start,
  stop,
  browse,
  load,
};

jest.mock("./client-manager", () => ({
  clientManager: clientManagerMock,
}));
