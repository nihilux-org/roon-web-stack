import { NgTemplateOutlet } from "@angular/common";
import { Component, inject, input, Signal } from "@angular/core";
import { LayoutData } from "@model";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-wide-layout",
  imports: [NgTemplateOutlet],
  templateUrl: "./wide-layout.component.html",
  styleUrl: "./wide-layout.component.scss",
})
export class WideLayoutComponent {
  layout = input.required<LayoutData>();
  readonly $isSmallTablet: Signal<boolean>;

  constructor() {
    this.$isSmallTablet = inject(SettingsService).isSmallTablet();
  }
}
