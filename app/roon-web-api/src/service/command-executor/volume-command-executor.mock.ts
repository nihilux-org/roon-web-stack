const executor = jest.fn();

export const volumeCommandExecutor = executor;

jest.mock("./volume-command-executor", () => ({
  executor,
}));
