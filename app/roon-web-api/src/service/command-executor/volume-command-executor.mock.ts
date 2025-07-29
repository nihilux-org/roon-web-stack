const executor = vi.fn();

export const volumeCommandExecutorMock = executor;

vi.mock("./volume-command-executor", () => ({
  executor,
}));
