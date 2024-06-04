import { APP_INITIALIZER, ApplicationConfig } from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { RoonService } from "@services/roon.service";

const startRoonService = (roonService: RoonService): (() => Promise<void>) => {
  return () => roonService.start();
};

const useMaterialSymbol = (iconRegistry: MatIconRegistry) => () => {
  const defaultFontSetClasses = iconRegistry.getDefaultFontSetClass();
  const outlinedFontSetClasses = defaultFontSetClasses
    .filter((fontSetClass) => fontSetClass !== "material-icons")
    .concat(["material-symbols-outlined"]);
  iconRegistry.setDefaultFontSetClass(...outlinedFontSetClasses);
};

export const nrConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: startRoonService,
      multi: true,
      deps: [RoonService],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: useMaterialSymbol,
      deps: [MatIconRegistry],
      multi: true,
    },
    provideAnimationsAsync(),
  ],
};
