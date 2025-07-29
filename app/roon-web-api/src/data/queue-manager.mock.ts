const build = vi.fn();

export const queueManagerFactoryMock = {
  build,
};

vi.mock("./queue-manager.ts", () => ({
  queueManagerFactory: {
    build,
  },
}));
