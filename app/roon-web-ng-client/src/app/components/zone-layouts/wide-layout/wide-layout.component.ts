import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, Input, Signal } from "@angular/core";
import { LayoutData } from "@model";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-wide-layout",
  imports: [NgTemplateOutlet],
  templateUrl: "./wide-layout.component.html",
  styleUrl: "./wide-layout.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WideLayoutComponent {
  @Input({ required: true }) layout!: LayoutData;
  readonly $isSmallTablet: Signal<boolean>;

  constructor() {
    this.$isSmallTablet = inject(SettingsService).isSmallTablet();
  }
}
