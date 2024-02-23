import { APP_INITIALIZER, ApplicationConfig } from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import { RoonService } from "@services/roon.service";

const startRoonService = (roonService: RoonService): (() => Promise<void>) => {
  return () => roonService.start();
};

export const nrConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: startRoonService,
      multi: true,
      deps: [RoonService],
    },
  ],
};
