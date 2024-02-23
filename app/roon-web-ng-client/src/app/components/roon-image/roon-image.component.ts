import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage, NgStyle } from "@angular/common";
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  Input,
  numberAttribute,
  OnChanges,
  SimpleChanges,
} from "@angular/core";

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
        return `/api/image/${config.src}?width=${width}&height=${height}&scale=fit`;
      },
    },
  ],
})
export class RoonImageComponent implements OnChanges {
  @Input({ required: true }) src!: string;
  @Input({ required: true, transform: numberAttribute }) width!: number;
  @Input({ required: true, transform: numberAttribute }) height!: number;
  @Input({ required: true }) alt!: string;
  @Input({ transform: booleanAttribute }) priority = false;
  loaderParams = {};

  ngOnChanges(changes: SimpleChanges) {
    let updateLoadParam = false;
    for (const changeKey in changes) {
      if (changeKey === "width" || changeKey === "height") {
        const change = changes[changeKey];
        if (change.isFirstChange()) {
          updateLoadParam = true;
          break;
        }
      }
    }
    if (updateLoadParam) {
      this.loaderParams = {
        height: this.height * 2,
        width: this.width * 2,
      };
    }
  }
}
