import { Component, input } from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { ZoneProgression } from "@model";

@Component({
  selector: "nr-zone-progression",
  imports: [MatProgressBarModule],
  templateUrl: "./zone-progression.component.html",
  styleUrl: "./zone-progression.component.scss",
})
export class ZoneProgressionComponent {
  $zoneProgression = input.required<ZoneProgression>();
}
