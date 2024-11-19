export const eventSourceMocks: Map<string, EventSourceMock> = new Map<string, EventSourceMock>();

export const resetEventSourceMocks: () => void = (): void => {
  eventSourceMocks.clear();
};

export class EventSourceMock {
  private readonly listeners: Map<string, EventListener>;
  private _state: number;
  private _onerror?: () => void;

  constructor() {
    this.listeners = new Map<string, EventListener>();
    this._state = 1;
  }

  close = jest.fn().mockImplementation(() => {
    this._state = 0;
    this.listeners.clear();
    return;
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

  set onerror(listener: (() => void) | undefined) {
    this._onerror = () => {
      this._state = 0;
      if (listener) {
        listener();
      }
    };
  }

  get OPEN(): number {
    return 1;
  }

  get readyState(): number {
    return this._state;
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
