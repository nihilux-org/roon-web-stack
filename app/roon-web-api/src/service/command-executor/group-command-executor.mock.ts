const executor = vi.fn();

export const groupCommandExecutorMock = executor;

vi.mock("./group-command-executor", () => ({
  executor,
}));
