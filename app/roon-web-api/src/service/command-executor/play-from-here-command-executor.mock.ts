import { Mock } from "vitest";

const executor: Mock = vi.fn();

export type PlayFromHereCommandExecutorMock = Mock;

export const playFromHereCommandExecutorMock: PlayFromHereCommandExecutorMock = executor;

vi.mock("./play-from-here-command-executor", () => ({
  executor,
}));
