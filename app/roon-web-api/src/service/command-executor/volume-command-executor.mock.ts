import { Mock } from "vitest";

const executor: Mock = vi.fn();

export type VolumeCommandExecutorMock = Mock;

export const volumeCommandExecutorMock: VolumeCommandExecutorMock = executor;

vi.mock("./volume-command-executor", () => ({
  executor,
}));
