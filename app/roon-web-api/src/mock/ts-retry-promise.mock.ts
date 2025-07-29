const retryDecorator = vi.fn();

export const retryMock = {
  retryDecorator,
};

vi.mock("ts-retry-promise", () => retryMock);
