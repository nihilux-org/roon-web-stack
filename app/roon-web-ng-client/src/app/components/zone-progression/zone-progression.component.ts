import { ChangeDetectionStrategy, Component, Input, Signal } from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { ZoneProgression } from "@model/client";

@Component({
  selector: "nr-zone-progression",
  standalone: true,
  imports: [MatProgressBarModule],
  templateUrl: "./zone-progression.component.html",
  styleUrl: "./zone-progression.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneProgressionComponent {
  @Input({ required: true }) $zoneProgression!: Signal<ZoneProgression>;
}
