import { FactoryProvider, InjectionToken } from "@angular/core";
import { RoonWorker } from "@model";

export const ROON_WORKER = new InjectionToken<RoonWorker>("roon.worker.factory");

export const roonWorkerFactory = () => {
  if (typeof Worker !== "undefined") {
    return new Worker(new URL("./roon.worker", import.meta.url), {
      type: "module",
    });
  } else {
    throw new Error("web worker are not supported in your browser, sorry");
  }
};

export const provideRoonWorker: () => FactoryProvider = () => ({
  provide: ROON_WORKER,
  useFactory: roonWorkerFactory,
});
