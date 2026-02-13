import { Mock } from "vitest";

const executor: Mock = vi.fn();

export type GroupCommandExecutorMock = Mock;

export const groupCommandExecutorMock: GroupCommandExecutorMock = executor;

vi.mock("./group-command-executor", () => ({
  executor,
}));
