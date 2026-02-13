import { Mock } from "vitest";

const debug: Mock = vi.fn();
const info: Mock = vi.fn();
const error: Mock = vi.fn();
const warn: Mock = vi.fn();

export interface LoggerMock {
  debug: Mock;
  info: Mock;
  error: Mock;
  warn: Mock;
}

export const loggerMock: LoggerMock = {
  debug,
  info,
  error,
  warn,
};

vi.mock("pino", () => {
  const pino = () => loggerMock;
  const stdTimeFunctions = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    isoTime: () => {},
  };
  return {
    pino,
    stdTimeFunctions,
  };
});
