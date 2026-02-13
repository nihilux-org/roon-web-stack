import { Mock } from "vitest";

const executor: Mock = vi.fn();

export type AudioInputCommandExecutor = Mock;

export const audioInputCommandExecutor: AudioInputCommandExecutor = executor;

vi.mock("./audio-input-command-executor", () => ({
  executor,
}));
