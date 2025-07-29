const executor = vi.fn();

export const transferZoneCommandExecutorMock = executor;

vi.mock("./transfer-zone-command-executor", () => ({
  executor,
}));
