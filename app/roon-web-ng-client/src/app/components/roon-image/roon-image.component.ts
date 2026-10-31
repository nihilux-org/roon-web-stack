import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from "@angular/common";
import { Component, computed, input } from "@angular/core";

@Component({
  selector: "nr-roon-image",
  imports: [NgOptimizedImage],
  templateUrl: "./roon-image.component.html",
  styleUrl: "./roon-image.component.scss",
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        const height = config.loaderParams?.["height"] as number;
        const width = config.loaderParams?.["width"] as number;
        return `/api/image?width=${width}&height=${height}&scale=fit&image_key=${config.src}`;
      },
    },
  ],
})
export class RoonImageComponent {
  src = input.required<string>();
  width = input.required<number>();
  height = input.required<number>();
  alt = input.required<string>();
  priority = input(false, {
    transform: (v: string | boolean) => !!(v || v === "true"),
  });
  loaderParams = computed(() => {
    return {
      height: this.height() * 2,
      width: this.width() * 2,
    };
  });
}
