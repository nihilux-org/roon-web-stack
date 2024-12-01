const dispatch = jest.fn();
const dispatchInternal = jest.fn();

export const commandDispatcherMock = {
  dispatch,
  dispatchInternal,
};

jest.mock("./command-dispatcher", () => ({
  commandDispatcher: commandDispatcherMock,
}));
