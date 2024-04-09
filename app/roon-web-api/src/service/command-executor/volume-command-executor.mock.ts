const executor = jest.fn();

export const volumeCommandExecutorMock = executor;

jest.mock("./volume-command-executor", () => ({
  executor,
}));
