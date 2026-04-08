import { Mock, vi } from "vitest";

const fetch: Mock = vi.fn();

export interface ImageFetcherMock {
  fetch: Mock;
}

export const imageFetcherMock: ImageFetcherMock = {
  fetch,
};

vi.mock("./image-fetcher", () => ({
  imageFetcher: imageFetcherMock,
}));
