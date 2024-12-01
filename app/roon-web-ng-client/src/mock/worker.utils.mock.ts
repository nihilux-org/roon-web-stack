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
          data: {
            status: "started",
            roonClientId: "roon_client_id",
          },
        },
      } as MessageEvent<RawWorkerEvent>);
    } else if (m.event === "worker-api" && m.data.type === "version") {
      onMessageListener({
        data: {
          event: "apiResult",
          data: {
            id: m.data.id,
            type: "version",
            data: "version",
          },
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
