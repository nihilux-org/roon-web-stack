const executor = jest.fn();

export const transferZoneCommandExecutorMock = executor;

jest.mock("./transfer-zone-command-executor", () => ({
  executor,
}));
