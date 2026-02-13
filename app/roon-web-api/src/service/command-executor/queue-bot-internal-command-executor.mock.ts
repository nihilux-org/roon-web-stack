import { Mock } from "vitest";

const internalExecutor: Mock = vi.fn();

export type QueueBotInternalCommandExecutorMock = Mock;

export const queueBotInternalCommandExecutorMock: QueueBotInternalCommandExecutorMock = internalExecutor;

vi.mock("./queue-bot-internal-command-executor", () => ({
  internalExecutor,
}));
