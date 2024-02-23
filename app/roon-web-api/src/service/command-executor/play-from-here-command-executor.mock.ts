const executor = jest.fn();

export const playCommandExecutorMock = executor;

jest.mock("./play-from-here-command-executor", () => ({
  executor,
}));
