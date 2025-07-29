import { vi } from "vitest";

const nanoid = vi.fn();

export const nanoidMock = nanoid;

vi.mock("nanoid", () => ({
  nanoid,
}));
