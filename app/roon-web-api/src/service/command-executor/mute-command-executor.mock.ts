const executor = vi.fn();

export const muteCommandExecutorMock = executor;

vi.mock("./mute-command-executor", () => ({
  executor,
}));
