import { RawWorkerEvent, WorkerActionMessage } from "@model/client";

let onMessageListener: (m: MessageEvent<RawWorkerEvent>) => void;
let receivedMessages: WorkerActionMessage[] = [];

export const roonWorkerMock = {
  postMessage: jest.fn().mockImplementation((m: WorkerActionMessage) => {
    receivedMessages.push(m);
    if (m.event === "worker-client" && m.data.action === "start-client") {
      onMessageListener({
        data: {
          event: "clientState",
          data: "started",
        },
      } as MessageEvent<RawWorkerEvent>);
    }
  }),
  set onmessage(listener: (m: MessageEvent<RawWorkerEvent>) => void) {
    onMessageListener = listener;
  },
  get onmessage() {
    return onMessageListener;
  },
  clearMessages: () => {
    receivedMessages = [];
  },
  get messages() {
    return receivedMessages;
  },
  dispatchEvent: (event: RawWorkerEvent): void => {
    onMessageListener({
      data: event,
    } as MessageEvent<RawWorkerEvent>);
  },
};

const buildRoonWorker = () => roonWorkerMock;

export const mockRoonWorker = () =>
  jest.mock("@services/worker.utils", () => ({
    buildRoonWorker,
  }));
