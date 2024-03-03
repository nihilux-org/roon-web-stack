const executor = jest.fn();

export const playFromHereCommandExecutorMock = executor;

jest.mock("./play-from-here-command-executor", () => ({
  executor,
}));
