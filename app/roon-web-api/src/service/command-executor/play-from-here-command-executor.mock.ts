const executor = vi.fn();

export const playFromHereCommandExecutorMock = executor;

vi.mock("./play-from-here-command-executor", () => ({
  executor,
}));
