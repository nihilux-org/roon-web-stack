const executor = vi.fn();

export const controlExecutorMock = executor;

vi.mock("./control-command-executor", () => ({
  executor,
}));
