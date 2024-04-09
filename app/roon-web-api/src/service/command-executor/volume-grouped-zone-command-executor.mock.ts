const executor = jest.fn();

export const volumeGroupedZoneCommandExecutorMock = executor;

jest.mock("./volume-grouped-zone-command-executor", () => ({
  executor,
}));
