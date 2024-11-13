import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EffectRef,
  Inject,
  OnDestroy,
  Signal,
} from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatTab, MatTabContent, MatTabGroup } from "@angular/material/tabs";
import { CustomActionsManagerComponent } from "@components/custom-actions-manager/custom-actions-manager.component";
import { ZoneSelectorComponent } from "@components/zone-selector/zone-selector.component";
import { SpatialNavigableContainerDirective } from "@directives/spatial-navigable-container.directive";
import { SpatialNavigableElementDirective } from "@directives/spatial-navigable-element.directive";
import { SpatialNavigableStarterDirective } from "@directives/spatial-navigable-starter.directive";
import { Action, ChosenTheme, CustomActionsManagerDialogConfig, DisplayMode, Theme, Themes } from "@model/client";
import { DialogService } from "@services/dialog.service";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { SpatialNavigationService } from "@services/spatial-navigation.service";

@Component({
  selector: "nr-settings-dialog",
  standalone: true,
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTab,
    MatTabContent,
    MatTabGroup,
    SpatialNavigableContainerDirective,
    SpatialNavigableElementDirective,
    SpatialNavigableStarterDirective,
    ZoneSelectorComponent,
  ],
  templateUrl: "./settings-dialog.component.html",
  styleUrl: "./settings-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDialogComponent implements OnDestroy {
  private readonly _dialogRef: MatDialogRef<SettingsDialogComponent>;
  private readonly _dialogService: DialogService;
  private readonly _settingsService: SettingsService;
  private readonly _spatialNavigationService: SpatialNavigationService;
  private readonly _layoutChangeEffect: EffectRef;
  readonly displayModeLabels: Map<DisplayMode, string>;
  readonly $chosenTheme: Signal<Theme>;
  readonly $isSmallScreen: Signal<boolean>;
  readonly $isOneColumn: Signal<boolean>;
  readonly $actions: Signal<Action[]>;
  readonly $availableActions: Signal<Action[]>;
  readonly $layoutClass: Signal<string>;
  readonly version: string;
  readonly selectedTab: number;
  constructor(
    @Inject(MAT_DIALOG_DATA) data: { selectedTab: number },
    dialogRef: MatDialogRef<SettingsDialogComponent>,
    dialogService: DialogService,
    roonService: RoonService,
    settingsService: SettingsService,
    spatialNavigationService: SpatialNavigationService
  ) {
    this._dialogRef = dialogRef;
    this._dialogService = dialogService;
    this._settingsService = settingsService;
    this._spatialNavigationService = spatialNavigationService;
    this.displayModeLabels = new Map<DisplayMode, string>();
    this.displayModeLabels.set(DisplayMode.COMPACT, "Compact");
    this.displayModeLabels.set(DisplayMode.WIDE, "Wide");
    this._layoutChangeEffect = effect(() => {
      for (const displayModeClass of this._settingsService.displayModeClasses()) {
        this._dialogRef.removePanelClass(displayModeClass);
      }
      this._dialogRef.addPanelClass(this.$layoutClass());
    });
    this.$chosenTheme = computed(() => {
      const chosenTheme = this._settingsService.chosenTheme()() as ChosenTheme;
      return Themes.find((t) => t.id === chosenTheme) ?? Themes[0];
    });
    this.$actions = this._settingsService.actions();
    this.$availableActions = this._settingsService.availableActions();
    this.$isSmallScreen = this._settingsService.isSmallScreen();
    this.$isOneColumn = this._settingsService.isOneColumn();
    this.$layoutClass = this._settingsService.displayModeClass();
    this.selectedTab = data.selectedTab;
    this.version = roonService.version();
  }

  ngOnDestroy(): void {
    this._layoutChangeEffect.destroy();
  }

  chosenThemes() {
    return Themes;
  }

  chosenTheme() {
    return this.$chosenTheme;
  }

  setChosenTheme(theme: ChosenTheme) {
    this._settingsService.saveChosenTheme(theme);
  }

  displayMode() {
    return this._settingsService.displayMode();
  }

  setDisplayMode(displayMode: DisplayMode) {
    this._settingsService.saveDisplayMode(displayMode);
  }

  onSave() {
    this._dialogService.close();
  }

  onReload() {
    this.onSave();
    window.location.reload();
  }

  displayModeLabel(displayMode: DisplayMode) {
    return this.displayModeLabels.get(displayMode) ?? "Unknown display mode 🤷";
  }

  displayModes() {
    const displayModes: { id: DisplayMode; label: string }[] = [];
    for (const [id, label] of this.displayModeLabels) {
      displayModes.push({ id, label });
    }
    return displayModes;
  }

  addAction(action: Action) {
    const actions = this.$actions();
    actions.push(action);
    this._settingsService.saveActions(actions);
  }

  removeAction(action: Action) {
    const actions = this.$actions();
    const index = actions.indexOf(action);
    if (index >= 0) {
      actions.splice(index, 1);
    }
    this._settingsService.saveActions(actions);
  }

  onActionsReordered(dropEvent: CdkDragDrop<Action[]>) {
    const actions = this.$actions();
    moveItemInArray(actions, dropEvent.previousIndex, dropEvent.currentIndex);
    this._settingsService.saveActions(actions);
  }

  openCustomActionsManager() {
    this._dialogService.open(CustomActionsManagerComponent, {
      ...CustomActionsManagerDialogConfig,
      data: {
        reset: true,
      },
    });
  }

  onMenOpen() {
    this._spatialNavigationService.suspendSpatialNavigation();
  }

  onMenuClosed() {
    this._spatialNavigationService.resumeSpatialNavigation();
  }

  protected readonly ChosenTheme = ChosenTheme;
}
