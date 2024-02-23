const convertZone = jest.fn();
const secondsToTimeString = jest.fn();
const convertQueue = jest.fn();
const toRoonSseMessage = jest.fn();
const buildApiState = jest.fn();

export const dataConverterMock = {
  buildApiState,
  convertQueue,
  convertZone,
  secondsToTimeString,
  toRoonSseMessage,
};

jest.mock("./data-converter", () => ({
  dataConverter: {
    buildApiState,
    convertQueue,
    convertZone,
    secondsToTimeString,
    toRoonSseMessage,
  },
}));
