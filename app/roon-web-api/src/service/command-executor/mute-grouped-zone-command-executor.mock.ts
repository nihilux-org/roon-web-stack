const executor = jest.fn();

export const muteGroupedZoneCommandExecutorMock = executor;

jest.mock("./mute-grouped-zone-command-executor", () => ({
  executor,
}));
