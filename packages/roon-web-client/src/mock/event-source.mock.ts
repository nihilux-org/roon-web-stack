export const eventSourceMocks: Map<string, EventSourceMock> = new Map<string, EventSourceMock>();

export const resetEventSourceMocks: () => void = (): void => {
  eventSourceMocks.clear();
};

export class EventSourceMock {
  private readonly listeners: Map<string, EventListener>;
  private _onerror?: () => void;

  constructor() {
    this.listeners = new Map<string, EventListener>();
  }

  close = jest.fn().mockImplementation(() => {
    this.listeners.clear();
    return Promise.resolve();
  });

  addEventListener = jest.fn().mockImplementation((type: string, listener: EventListener): void => {
    this.listeners.set(type, listener);
  });

  getEventListener = (event: string): EventListener | undefined => {
    return this.listeners.get(event);
  };

  dispatchEvent = (event: MessageEvent<string>): void => {
    const listener = this.listeners.get(event.type);
    if (listener) {
      listener(event);
    }
  };

  get onerror(): (() => void) | undefined {
    return this._onerror;
  }

  set onerror(listener: () => void) {
    this._onerror = listener;
  }
}

export const eventSourceMockConstructor = jest.fn().mockImplementation((url: URL): EventSourceMock => {
  const eventSourceMock = new EventSourceMock();
  eventSourceMocks.set(url.toString(), eventSourceMock);
  return eventSourceMock;
});

Object.defineProperty(global, "EventSource", {
  writable: true,
  value: eventSourceMockConstructor,
});
