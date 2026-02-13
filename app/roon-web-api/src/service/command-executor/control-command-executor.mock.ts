import { Mock } from "vitest";

const executor: Mock = vi.fn();

export type ControlExecutorMock = Mock;

export const controlExecutorMock: ControlExecutorMock = executor;

vi.mock("./control-command-executor", () => ({
  executor,
}));
