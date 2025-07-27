import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { RoonService } from "@services/roon.service";

const useMaterialSymbol = (iconRegistry: MatIconRegistry) => {
  const defaultFontSetClasses = iconRegistry.getDefaultFontSetClass();
  const outlinedFontSetClasses = defaultFontSetClasses
    .filter((fontSetClass) => fontSetClass !== "material-icons")
    .concat(["material-symbols-outlined"]);
  iconRegistry.setDefaultFontSetClass(...outlinedFontSetClasses);
};

export const nrConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const iconRegistry: MatIconRegistry = inject(MatIconRegistry);
      useMaterialSymbol(iconRegistry);
      const roonService = inject(RoonService);
      return roonService.start();
    }),
    provideAnimationsAsync(),
    provideZonelessChangeDetection(),
  ],
};
