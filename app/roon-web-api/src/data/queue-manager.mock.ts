import { Mock } from "vitest";

const build: Mock = vi.fn();

export interface QueueManagerFactoryMock {
  build: Mock;
}

export const queueManagerFactoryMock: QueueManagerFactoryMock = {
  build,
};

vi.mock("./queue-manager.ts", () => ({
  queueManagerFactory: {
    build,
  },
}));
