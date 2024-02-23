const retryDecorator = jest.fn();

export const retryMock = {
  retryDecorator,
};

jest.mock("ts-retry-promise", () => retryMock);
