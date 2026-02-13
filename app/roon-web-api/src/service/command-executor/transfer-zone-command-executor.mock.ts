import { Mock } from "vitest";

const executor: Mock = vi.fn();

export type TransferZoneCommandExecutorMock = Mock;

export const transferZoneCommandExecutorMock: TransferZoneCommandExecutorMock = executor;

vi.mock("./transfer-zone-command-executor", () => ({
  executor,
}));
