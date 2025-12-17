const executor = vi.fn();

export const audioInputCommandExecutor = executor;

vi.mock("./audio-input-command-executor", () => ({
  executor,
}));
