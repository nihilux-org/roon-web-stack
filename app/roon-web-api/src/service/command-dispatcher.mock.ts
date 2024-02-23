const dispatch = jest.fn();

export const commandDispatcherMock = {
  dispatch,
};

jest.mock("./command-dispatcher", () => ({
  commandDispatcher: commandDispatcherMock,
}));
