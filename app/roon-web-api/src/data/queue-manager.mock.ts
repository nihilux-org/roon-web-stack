const build = jest.fn().mockImplementation();

export const queueManagerFactoryMock = {
  build,
};

jest.mock("./queue-manager.ts", () => ({
  queueManagerFactory: {
    build,
  },
}));
