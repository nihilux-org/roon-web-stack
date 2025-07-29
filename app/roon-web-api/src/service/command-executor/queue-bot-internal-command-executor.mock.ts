const internalExecutor = vi.fn();

export const queueBotInternalCommandExecutorMock = internalExecutor;

vi.mock("./queue-bot-internal-command-executor", () => ({
  internalExecutor,
}));
