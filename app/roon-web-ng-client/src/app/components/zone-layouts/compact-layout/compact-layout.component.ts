import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, Input, Signal } from "@angular/core";
import { LayoutData } from "@model/client";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-compact-layout",
  imports: [NgTemplateOutlet],
  templateUrl: "./compact-layout.component.html",
  styleUrl: "./compact-layout.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompactLayoutComponent {
  @Input({ required: true }) layout!: LayoutData;
  readonly $isSmallTablet: Signal<boolean>;

  constructor() {
    this.$isSmallTablet = inject(SettingsService).isSmallTablet();
  }
}
