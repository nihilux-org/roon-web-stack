import { Mock } from "vitest";

const events: Mock = vi.fn();
const close: Mock = vi.fn();
const command: Mock = vi.fn();
const browse: Mock = vi.fn();
const load: Mock = vi.fn();

export interface ClientMock {
  events: Mock;
  close: Mock;
  command: Mock;
  browse: Mock;
  load: Mock;
}

export const clientMock: ClientMock = {
  events,
  close,
  command,
  browse,
  load,
};

const register: Mock = vi.fn();
const unregister: Mock = vi.fn();
const get: Mock = vi.fn().mockImplementation((_) => clientMock);
const start: Mock = vi.fn();
const stop: Mock = vi.fn();

export interface ClientManagerMock {
  register: Mock;
  unregister: Mock;
  get: Mock;
  start: Mock;
  stop: Mock;
}

export const clientManagerMock: ClientManagerMock = {
  register,
  unregister,
  get,
  start,
  stop,
};

vi.mock("./client-manager", () => ({
  clientManager: clientManagerMock,
}));
