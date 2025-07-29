const executor = vi.fn();

export const sharedConfigCommandExecutor = executor;

vi.mock("./shared-config-command-executor", () => ({
  executor,
}));
