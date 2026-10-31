import { Component, input } from "@angular/core";
import { EMPTY_TRACK, TrackDisplay } from "@model";

@Component({
  selector: "nr-zone-current-track",
  imports: [],
  templateUrl: "./zone-current-track.component.html",
  styleUrl: "./zone-current-track.component.scss",
})
export class ZoneCurrentTrackComponent {
  $isOneColumn = input.required<boolean>();
  $trackDisplay = input.required<TrackDisplay>();
  protected readonly EMPTY_TRACK = EMPTY_TRACK;
}
