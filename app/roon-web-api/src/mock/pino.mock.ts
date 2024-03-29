const debug = jest.fn();
const info = jest.fn();
const error = jest.fn();
const warn = jest.fn();

export const loggerMock = {
  debug,
  info,
  error,
  warn,
};

jest.mock("pino", () => {
  const pino = () => loggerMock;
  pino.stdTimeFunctions = {
    isoTime: () => {},
  };
  return {
    pino,
  };
});
