import { roonWorkerMock } from "@mock";

import { Provider } from "@angular/core";
import { ROON_WORKER } from "@services/roon.worker.provider";

const testProviders: Provider[] = [
  {
    provide: ROON_WORKER,
    useValue: roonWorkerMock,
  },
];

export default testProviders;
