const executor = jest.fn();

export const sharedConfigCommandExecutor = executor;

jest.mock("./shared-config-command-executor", () => ({
  executor,
}));
