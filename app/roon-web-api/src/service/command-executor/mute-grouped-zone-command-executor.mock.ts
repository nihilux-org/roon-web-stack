const executor = vi.fn();

export const muteGroupedZoneCommandExecutorMock = executor;

vi.mock("./mute-grouped-zone-command-executor", () => ({
  executor,
}));
