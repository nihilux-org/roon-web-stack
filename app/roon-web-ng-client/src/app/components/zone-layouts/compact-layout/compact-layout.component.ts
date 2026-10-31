import { NgTemplateOutlet } from "@angular/common";
import { Component, inject, input, Signal } from "@angular/core";
import { LayoutData } from "@model";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-compact-layout",
  imports: [NgTemplateOutlet],
  templateUrl: "./compact-layout.component.html",
  styleUrl: "./compact-layout.component.scss",
})
export class CompactLayoutComponent {
  layout = input.required<LayoutData>();
  readonly $isSmallTablet: Signal<boolean>;

  constructor() {
    this.$isSmallTablet = inject(SettingsService).isSmallTablet();
  }
}
