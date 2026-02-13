import { Mock } from "vitest";

const retryDecorator: Mock = vi.fn();

export interface RetryMock {
  retryDecorator: Mock;
}

export const retryMock: RetryMock = {
  retryDecorator,
};

vi.mock("ts-retry-promise", () => retryMock);
