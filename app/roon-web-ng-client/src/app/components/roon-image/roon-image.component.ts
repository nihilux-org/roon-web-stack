import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage, NgStyle } from "@angular/common";
import { booleanAttribute, ChangeDetectionStrategy, Component, Input, numberAttribute, OnInit } from "@angular/core";

@Component({
  selector: "nr-roon-image",
  standalone: true,
  imports: [NgOptimizedImage, NgStyle],
  templateUrl: "./roon-image.component.html",
  styleUrl: "./roon-image.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class RoonImageComponent implements OnInit {
  @Input({ required: true }) src!: string;
  @Input({ required: true, transform: numberAttribute }) width!: number;
  @Input({ required: true, transform: numberAttribute }) height!: number;
  @Input({ required: true }) alt!: string;
  @Input({ transform: booleanAttribute }) priority;
  loaderParams: {
    height: number;
    width: number;
  };

  constructor() {
    this.priority = false;
    this.loaderParams = {
      height: 0,
      width: 0,
    };
  }

  ngOnInit(): void {
    this.loaderParams = {
      height: this.height * 2,
      width: this.width * 2,
    };
  }
}
