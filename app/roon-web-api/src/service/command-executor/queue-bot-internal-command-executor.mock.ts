const internalExecutor = jest.fn();

export const queueBotInternalCommandExecutorMock = internalExecutor;

jest.mock("./queue-bot-internal-command-executor", () => ({
  internalExecutor,
}));
