const start = vi.fn();
const watchQueue = vi.fn();

export const queueBotMock = {
  start,
  watchQueue,
};

vi.mock("./queue-bot-manager", () => ({
  queueBot: queueBotMock,
}));
