const executor = jest.fn();

export const controlExecutorMock = executor;

jest.mock("./control-command-executor", () => ({
  executor,
}));
