import { Mock } from "vitest";

const start: Mock = vi.fn();
const watchQueue: Mock = vi.fn();

export interface QueueBotMock {
  start: Mock;
  watchQueue: Mock;
}

export const queueBotMock: QueueBotMock = {
  start,
  watchQueue,
};

vi.mock("./queue-bot-manager", () => ({
  queueBot: queueBotMock,
}));
