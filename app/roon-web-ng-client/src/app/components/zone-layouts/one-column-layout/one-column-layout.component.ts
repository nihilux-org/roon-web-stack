import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { LayoutData } from "@model";

@Component({
  selector: "nr-one-column-layout",
  imports: [NgTemplateOutlet],
  templateUrl: "./one-column-layout.component.html",
  styleUrl: "./one-column-layout.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OneColumnLayoutComponent {
  @Input({ required: true }) layout!: LayoutData;
}
