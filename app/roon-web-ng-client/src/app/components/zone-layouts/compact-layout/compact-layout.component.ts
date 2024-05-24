import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { LayoutData } from "@model/client";

@Component({
  selector: "nr-compact-layout",
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: "./compact-layout.component.html",
  styleUrl: "./compact-layout.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompactLayoutComponent {
  @Input({ required: true }) layout!: LayoutData;
}
