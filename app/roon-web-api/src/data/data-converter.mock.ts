const convertZone = vi.fn();
const secondsToTimeString = vi.fn();
const convertQueue = vi.fn();
const toRoonSseMessage = vi.fn();
const buildApiState = vi.fn();

export const dataConverterMock = {
  buildApiState,
  convertQueue,
  convertZone,
  secondsToTimeString,
  toRoonSseMessage,
};

vi.mock("./data-converter", () => ({
  dataConverter: {
    buildApiState,
    convertQueue,
    convertZone,
    secondsToTimeString,
    toRoonSseMessage,
  },
}));
