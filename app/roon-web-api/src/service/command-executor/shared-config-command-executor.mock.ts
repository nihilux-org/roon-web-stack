import { Mock } from "vitest";

const executor: Mock = vi.fn();

export type SharedConfigCommandExecutor = Mock;

export const sharedConfigCommandExecutor: SharedConfigCommandExecutor = executor;

vi.mock("./shared-config-command-executor", () => ({
  executor,
}));
