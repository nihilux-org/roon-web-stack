import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { DEFAULT_ZONE_PROGRESSION, ZoneProgression } from "@model/client";

@Component({
  selector: "nr-zone-progression",
  standalone: true,
  imports: [MatProgressBarModule],
  templateUrl: "./zone-progression.component.html",
  styleUrl: "./zone-progression.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneProgressionComponent {
  @Input({ required: true }) zoneProgression: ZoneProgression = DEFAULT_ZONE_PROGRESSION;
}
