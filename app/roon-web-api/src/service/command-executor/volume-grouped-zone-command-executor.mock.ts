const executor = vi.fn();

export const volumeGroupedZoneCommandExecutorMock = executor;

vi.mock("./volume-grouped-zone-command-executor", () => ({
  executor,
}));
