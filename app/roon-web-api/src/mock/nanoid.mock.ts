import { Mock } from "vitest";

const nanoid: Mock = vi.fn();

export type NanoidMock = Mock;

export const nanoidMock: NanoidMock = nanoid;

vi.mock("nanoid", () => ({
  nanoid,
}));
