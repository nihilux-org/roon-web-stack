import { Mock } from "vitest";

const executor: Mock = vi.fn();

export type VolumeGroupedZoneCommandExecutorMock = Mock;

export const volumeGroupedZoneCommandExecutorMock: VolumeGroupedZoneCommandExecutorMock = executor;

vi.mock("./volume-grouped-zone-command-executor", () => ({
  executor,
}));
