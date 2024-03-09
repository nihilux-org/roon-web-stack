const executor = jest.fn();

export const groupCommandExecutorMock = executor;

jest.mock("./group-command-executor", () => ({
  executor,
}));
