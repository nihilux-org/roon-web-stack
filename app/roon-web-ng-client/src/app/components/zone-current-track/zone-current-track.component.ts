import { ChangeDetectionStrategy, Component, Input, Signal } from "@angular/core";
import { EMPTY_TRACK, TrackDisplay } from "@model";

@Component({
  selector: "nr-zone-current-track",
  imports: [],
  templateUrl: "./zone-current-track.component.html",
  styleUrl: "./zone-current-track.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneCurrentTrackComponent {
  @Input({ required: true }) $isOneColumn!: Signal<boolean>;
  @Input({ required: true }) $trackDisplay!: Signal<TrackDisplay>;
  protected readonly EMPTY_TRACK = EMPTY_TRACK;
}
