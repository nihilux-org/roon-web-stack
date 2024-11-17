import { ChangeDetectionStrategy, Component, computed, Signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { CustomActionRecorderComponent } from "@components/custom-action-recorder/custom-action-recorder.component";
import { SpatialNavigableStarterDirective } from "@directives/spatial-navigable-starter.directive";
import { RoonApiBrowseHierarchy } from "@model";
import { CustomActionsManagerDialogConfig, CustomActionsManagerDialogConfigBigFonts } from "@model/client";
import { CustomActionsService } from "@services/custom-actions.service";
import { DialogService } from "@services/dialog.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-custom-action-editor",
  standalone: true,
  imports: [FormsModule, MatButton, MatFormFieldModule, MatIcon, MatInput, MatLabel, SpatialNavigableStarterDirective],
  templateUrl: "./custom-action-editor.component.html",
  styleUrl: "./custom-action-editor.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomActionEditorComponent {
  private readonly _customActionsService: CustomActionsService;
  private readonly _dialogService: DialogService;
  private readonly _$isBigFonts: Signal<boolean>;
  readonly $label: Signal<string>;
  readonly $icon: Signal<string>;
  readonly $hierarchy: Signal<RoonApiBrowseHierarchy | undefined>;
  readonly $path: Signal<string[]>;
  readonly $actionIndex: Signal<number | undefined>;

  constructor(
    customActionService: CustomActionsService,
    dialogService: DialogService,
    settingsService: SettingsService
  ) {
    this._customActionsService = customActionService;
    this._dialogService = dialogService;
    this._$isBigFonts = settingsService.isBigFonts();
    this.$label = computed(() => this._customActionsService.label()() ?? "");
    this.$icon = computed(() => this._customActionsService.icon()() ?? "");
    this.$hierarchy = this._customActionsService.hierarchy();
    this.$path = this._customActionsService.path();
    this.$actionIndex = this._customActionsService.actionIndex();
  }

  openActionRecorder() {
    const config = this._$isBigFonts() ? CustomActionsManagerDialogConfigBigFonts : CustomActionsManagerDialogConfig;
    this._dialogService.open(CustomActionRecorderComponent, {
      ...config,
    });
  }

  saveLabel(label: string) {
    this._customActionsService.saveLabel(label);
  }

  saveIcon(icon: string) {
    this._customActionsService.saveIcon(icon);
  }
}
