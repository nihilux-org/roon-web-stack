import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input, Signal } from "@angular/core";
import { LayoutData } from "@model/client";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-wide-layout",
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: "./wide-layout.component.html",
  styleUrl: "./wide-layout.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WideLayoutComponent {
  @Input({ required: true }) layout!: LayoutData;
  readonly $isSmallTablet: Signal<boolean>;

  constructor(settingsService: SettingsService) {
    this.$isSmallTablet = settingsService.isSmallTablet();
  }
}
