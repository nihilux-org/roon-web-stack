import { NgTemplateOutlet } from "@angular/common";
import { Component, input } from "@angular/core";
import { LayoutData } from "@model";

@Component({
  selector: "nr-one-column-layout",
  imports: [NgTemplateOutlet],
  templateUrl: "./one-column-layout.component.html",
  styleUrl: "./one-column-layout.component.scss",
})
export class OneColumnLayoutComponent {
  layout = input.required<LayoutData>();
}
