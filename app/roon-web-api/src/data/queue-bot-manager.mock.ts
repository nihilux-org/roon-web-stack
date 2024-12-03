const start = jest.fn().mockImplementation();
const watchQueue = jest.fn().mockImplementation();

export const queueBotMock = {
  start,
  watchQueue,
};

jest.mock("./queue-bot-manager", () => ({
  queueBot: queueBotMock,
}));
