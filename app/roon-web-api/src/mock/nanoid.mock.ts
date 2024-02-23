const nanoid = jest.fn();

export const nanoidMock = nanoid;

jest.mock("nanoid", () => ({
  nanoid,
}));
