import { Mock } from "vitest";

const executor: Mock = vi.fn();

export type MuteCommandExecutorMock = Mock;

export const muteCommandExecutorMock: MuteCommandExecutorMock = executor;

vi.mock("./mute-command-executor", () => ({
  executor,
}));
