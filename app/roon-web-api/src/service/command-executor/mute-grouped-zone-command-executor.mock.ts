import { Mock } from "vitest";

const executor: Mock = vi.fn();

export type MuteGroupedZoneCommandExecutorMock = Mock;

export const muteGroupedZoneCommandExecutorMock: MuteGroupedZoneCommandExecutorMock = executor;

vi.mock("./mute-grouped-zone-command-executor", () => ({
  executor,
}));
