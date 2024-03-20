import { bootstrapApplication } from "@angular/platform-browser";
import { nrConfig } from "./app/nr.config";
import { NrRootComponent } from "./app/nr-root.component";

bootstrapApplication(NrRootComponent, nrConfig).catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
