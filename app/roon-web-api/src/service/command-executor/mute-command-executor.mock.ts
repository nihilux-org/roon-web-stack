const executor = jest.fn();

export const muteCommandExecutorMock = executor;

jest.mock("./mute-command-executor", () => ({
  executor,
}));
