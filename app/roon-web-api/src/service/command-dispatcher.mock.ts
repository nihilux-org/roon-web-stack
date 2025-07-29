const dispatch = vi.fn();
const dispatchInternal = vi.fn();

export const commandDispatcherMock = {
  dispatch,
  dispatchInternal,
};

vi.mock("./command-dispatcher", () => ({
  commandDispatcher: commandDispatcherMock,
}));
