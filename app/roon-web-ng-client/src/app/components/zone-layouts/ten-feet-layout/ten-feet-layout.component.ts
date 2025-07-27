import { animate, animateChild, group, query, state, style, transition, trigger } from "@angular/animations";
import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Signal,
} from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatRipple } from "@angular/material/core";
import { MatIcon } from "@angular/material/icon";
import { SettingsDialogComponent } from "@components/settings-dialog/settings-dialog.component";
import { ZoneSelectorComponent } from "@components/zone-selector/zone-selector.component";
import { LayoutData, SettingsDialogConfig, SettingsDialogConfigBigFonts } from "@model";
import { NgxSpatialNavigableContainerDirective } from "@nihilux/ngx-spatial-navigable";
import { DialogService } from "@services/dialog.service";
import { IdleService } from "@services/idle.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-ten-feet-layout",
  imports: [
    MatIcon,
    MatIconButton,
    MatRipple,
    NgTemplateOutlet,
    ZoneSelectorComponent,
    NgxSpatialNavigableContainerDirective,
  ],
  templateUrl: "./ten-feet-layout.component.html",
  styleUrl: "./ten-feet-layout.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("zoneImage", [
      state(
        "idle",
        style({
          width: "100%",
          flexGrow: 1,
        })
      ),
      state(
        "active",
        style({
          width: "60%",
          flexGrow: 0,
        })
      ),
      transition("idle <=> active", [animate("0.5s ease-out")]),
      transition(":enter", []),
    ]),
    trigger("zoneInfo", [
      state(
        "idle",
        style({
          maxWidth: "100%",
        })
      ),
      state(
        "active",
        style({
          maxWidth: "42%",
        })
      ),
      transition("idle => active", [animate("0.2s ease-out")]),
      transition("active => idle", [animate("0.2s 0.2s ease-in")]),
      transition(":enter", []),
    ]),
    trigger("zoneCommands", [
      state(
        "idle",
        style({
          opacity: 0,
        })
      ),
      state(
        "active",
        style({
          opacity: 1,
        })
      ),
      transition("idle <=> active", [animate("0.5s ease-out")]),
      transition(":enter", []),
    ]),
    trigger("zoneActions", [
      state(
        "idle",
        style({
          right: "-40%",
          opacity: 0,
        })
      ),
      state(
        "active",
        style({
          right: "1rem",
          opacity: 1,
        })
      ),
      transition("idle <=> active", [animate("0.5s ease-out")]),
      transition(":enter", []),
    ]),
    trigger("idleOverlay", [
      transition("idle <=> active", [group([query("@*", animateChild())])]),
      transition(":enter", []),
    ]),
  ],
})
export class TenFeetLayoutComponent implements OnInit, OnDestroy {
  @Input({ required: true }) layout!: LayoutData;
  private readonly _dialogService: DialogService;
  private readonly _idleService: IdleService;
  private readonly _$isBigFont: Signal<boolean>;
  readonly $isIdle: Signal<boolean>;
  readonly $animationState: Signal<string>;

  constructor() {
    this._dialogService = inject(DialogService);
    this._idleService = inject(IdleService);
    this._$isBigFont = inject(SettingsService).isBigFonts();
    this.$isIdle = this._idleService.isIdle();
    effect(() => {
      if (this.$isIdle()) {
        this._dialogService.close();
      }
    });
    this.$animationState = computed(() => {
      if (this.$isIdle()) {
        return "idle";
      } else {
        return "active";
      }
    });
  }

  ngOnInit(): void {
    this._idleService.startWatch();
  }

  ngOnDestroy(): void {
    this._idleService.stopWatch();
  }

  onOpenSettingsDialog(): void {
    const config = this._$isBigFont() ? SettingsDialogConfigBigFonts : SettingsDialogConfig;
    this._dialogService.open(SettingsDialogComponent, {
      ...config,
    });
  }
}
