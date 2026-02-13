import { Mock } from "vitest";

const dispatch: Mock = vi.fn();
const dispatchInternal: Mock = vi.fn();

export interface CommandDispatcherMock {
  dispatch: Mock;
  dispatchInternal: Mock;
}

export const commandDispatcherMock: CommandDispatcherMock = {
  dispatch,
  dispatchInternal,
};

vi.mock("./command-dispatcher", () => ({
  commandDispatcher: commandDispatcherMock,
}));
