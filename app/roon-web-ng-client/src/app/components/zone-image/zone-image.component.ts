import { deepEqual } from "fast-equals";
import { ChangeDetectionStrategy, Component, computed, Input, Signal } from "@angular/core";
import { RoonImageComponent } from "@components/roon-image/roon-image.component";
import { EMPTY_TRACK, TrackDisplay, TrackImage } from "@model/client";

@Component({
  selector: "nr-zone-image",
  standalone: true,
  imports: [RoonImageComponent],
  templateUrl: "./zone-image.component.html",
  styleUrl: "./zone-image.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneImageComponent {
  protected readonly EMPTY_TRACK = EMPTY_TRACK;
  @Input({ required: true }) $trackDisplay!: Signal<TrackDisplay>;
  readonly $image: Signal<TrackImage>;

  constructor() {
    this.$image = computed(
      () => {
        const src = this.$trackDisplay().image_key ?? "";
        const size = Math.min(window.innerWidth, window.innerHeight);
        const isReady = src !== "" && size > 0;
        return {
          src,
          size,
          isReady,
        };
      },
      {
        equal: deepEqual,
      }
    );
  }
}
