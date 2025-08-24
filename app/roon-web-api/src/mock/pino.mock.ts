const debug = vi.fn();
const info = vi.fn();
const error = vi.fn();
const warn = vi.fn();

export const loggerMock = {
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
