import { Mock } from "vitest";

const convertZone = vi.fn();
const secondsToTimeString = vi.fn();
const convertQueue = vi.fn();
const toRoonSseMessage = vi.fn();
const buildApiState = vi.fn();

export interface DataConverterMock {
  buildApiState: Mock;
  convertQueue: Mock;
  convertZone: Mock;
  secondsToTimeString: Mock;
  toRoonSseMessage: Mock;
}

export const dataConverterMock: DataConverterMock = {
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
