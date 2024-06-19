/// <reference lib="webworker" />

import { defer, retry } from "rxjs";
import { RoonWebClient } from "@model";
import {
  ApiResultWorkerEvent,
  ApiStateWorkerEvent,
  BrowseApiResult,
  ClientStateWorkerEvent,
  CommandApiResult,
  CommandStateWorkerEvent,
  FoundItemIndexApiResult,
  LoadApiResult,
  QueueStateWorkerEvent,
  RawApiResult,
  RawWorkerApiRequest,
  WorkerActionMessage,
  WorkerClientAction,
  ZoneStateWorkerEvent,
} from "@model/client";
import { roonWebClientFactory } from "@nihilux/roon-web-client";

let _roonClient: RoonWebClient;
let _isRefreshing = false;
let _isDesktop = true;
let _refreshInterval: ReturnType<typeof setInterval> | undefined = undefined;

addEventListener("message", (m: MessageEvent<WorkerActionMessage>) => {
  switch (m.data.event) {
    case "worker-client":
      onClientActionMessage(m.data.data);
      break;
    case "worker-api":
      onApiRequest(m.data.data);
      break;
  }
});

const onClientActionMessage = (clientAction: WorkerClientAction): void => {
  switch (clientAction.action) {
    case "start-client":
      startClient(clientAction.url, clientAction.isDesktop);
      break;
    case "refresh-client":
      refreshClient();
      break;
    case "restart-client":
      restartClient();
      break;
  }
};

const startClient = (url: string, isDesktop: boolean): void => {
  _isDesktop = isDesktop;
  _roonClient = roonWebClientFactory.build(new URL(url));
  _roonClient.onClientState((clientState) => {
    const message: ClientStateWorkerEvent = {
      event: "clientState",
      data: clientState,
    };
    postMessage(message);
  });
  _roonClient.onRoonState((roonState) => {
    const message: ApiStateWorkerEvent = {
      data: roonState,
      event: "state",
    };
    postMessage(message);
  });
  _roonClient.onCommandState((commandState) => {
    const message: CommandStateWorkerEvent = {
      event: "command",
      data: commandState,
    };
    postMessage(message);
  });
  _roonClient.onQueueState((queueState) => {
    const message: QueueStateWorkerEvent = {
      event: "queue",
      data: queueState,
    };
    postMessage(message);
  });
  _roonClient.onZoneState((zoneState) => {
    const message: ZoneStateWorkerEvent = {
      event: "zone",
      data: zoneState,
    };
    postMessage(message);
  });
  void _roonClient
    .start()
    .then(() => {
      const message: ClientStateWorkerEvent = {
        event: "clientState",
        data: "started",
      };
      startHealthCheck();
      postMessage(message);
    })
    .catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("error during RoonClient start", err);
      const message: ClientStateWorkerEvent = {
        event: "clientState",
        data: "not-started",
      };
      postMessage(message);
    });
};

const refreshClient = (): void => {
  if (!_isRefreshing) {
    stopHealthCheck();
    _isRefreshing = true;
    const refreshSub = defer(() => _roonClient.refresh())
      .pipe(
        retry({
          count: 5,
        })
      )
      .subscribe({
        next: () => {
          refreshSub.unsubscribe();
          _isRefreshing = false;
          startHealthCheck();
        },
        error: () => {
          refreshSub.unsubscribe();
          _isRefreshing = false;
          const message: ApiStateWorkerEvent = {
            event: "state",
            data: {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error use string as import of enum seems broken in worker 🤷
              state: "STOPPED",
              zones: [],
              outputs: [],
            },
          };
          postMessage(message);
        },
      });
  }
};

const restartClient = (): void => {
  _isRefreshing = true;
  stopHealthCheck();
  const retrySub = defer(() => _roonClient.restart())
    .pipe(
      retry({
        delay: 5000,
      })
    )
    .subscribe(() => {
      retrySub.unsubscribe();
      _isRefreshing = false;
      startHealthCheck();
    });
};

const onApiRequest = (apiRequest: RawWorkerApiRequest): void => {
  const { type, id } = apiRequest;
  switch (type) {
    case "browse":
      void _roonClient
        .browse(apiRequest.data)
        .then((data) => {
          const message: BrowseApiResult = {
            data,
            type,
            id,
          };
          postApiResult(message);
        })
        .catch((error: unknown) => {
          const message: BrowseApiResult = {
            error,
            type,
            id,
          };
          postApiResult(message);
        });
      break;
    case "command":
      void _roonClient
        .command(apiRequest.data)
        .then((data) => {
          const message: CommandApiResult = {
            type,
            id,
            data,
          };
          postApiResult(message);
        })
        .catch((error: unknown) => {
          const message: CommandApiResult = {
            type,
            id,
            error,
          };
          postApiResult(message);
        });
      break;
    case "load":
      void _roonClient
        .load(apiRequest.data)
        .then((data) => {
          const message: LoadApiResult = {
            type,
            data,
            id,
          };
          postApiResult(message);
        })
        .catch((error: unknown) => {
          const message: LoadApiResult = {
            type,
            error,
            id,
          };
          postApiResult(message);
        });
      break;
    case "navigate":
      void _roonClient
        .browse({
          hierarchy: apiRequest.data.hierarchy,
          item_key: apiRequest.data.item_key,
          input: apiRequest.data.input,
          zone_or_output_id: apiRequest.data.zone_id,
        })
        .then((browseResponse) => {
          return _roonClient.load({
            hierarchy: apiRequest.data.hierarchy,
            level: browseResponse.list?.level,
          });
        })
        .then((data) => {
          const message: LoadApiResult = {
            data,
            id,
            type: "load",
          };
          postApiResult(message);
        })
        .catch((error: unknown) => {
          const message: LoadApiResult = {
            type: "load",
            error,
            id,
          };
          postApiResult(message);
        });
      break;
    case "previous":
      void _roonClient
        .browse({
          hierarchy: apiRequest.data.hierarchy,
          pop_levels: apiRequest.data.levels,
          zone_or_output_id: apiRequest.data.zone_id,
        })
        .then((browseResponse) => {
          return _roonClient.load({
            hierarchy: apiRequest.data.hierarchy,
            level: browseResponse.list?.level,
            offset: apiRequest.data.offset,
          });
        })
        .then((data) => {
          const message: LoadApiResult = {
            type: "load",
            id,
            data,
          };
          postApiResult(message);
        })
        .catch((error: unknown) => {
          const message: LoadApiResult = {
            type: "load",
            id,
            error,
          };
          postApiResult(message);
        });
      break;
    case "version":
      postApiResult({
        type,
        data: _roonClient.version(),
        id,
      });
      break;
    case "load-path":
      void _roonClient
        .loadPath(apiRequest.data.zone_id, apiRequest.data.path)
        .then((data) => {
          const message: LoadApiResult = {
            type: "load",
            id,
            data,
          };
          postApiResult(message);
        })
        .catch((error: unknown) => {
          const message: LoadApiResult = {
            type: "load",
            id,
            error,
          };
          postApiResult(message);
        });
      break;
    case "find-item-index":
      void _roonClient
        .findItemIndex(apiRequest.data.itemIndexSearch)
        .then((data) => {
          const message: FoundItemIndexApiResult = {
            type: "found-item-index",
            id,
            data,
          };
          postApiResult(message);
        })
        .catch((error: unknown) => {
          const message: FoundItemIndexApiResult = {
            type: "found-item-index",
            id,
            error,
          };
          postApiResult(message);
        });
      break;
  }
};

const startHealthCheck = () => {
  if (_isDesktop) {
    _refreshInterval = setInterval(() => {
      refreshClient();
    }, 1000);
  }
};

const stopHealthCheck = () => {
  if (_refreshInterval) {
    clearInterval(_refreshInterval);
    _refreshInterval = undefined;
  }
};

const postApiResult = (data: RawApiResult): void => {
  const message: ApiResultWorkerEvent = {
    event: "apiResult",
    data,
  };
  postMessage(message);
};
