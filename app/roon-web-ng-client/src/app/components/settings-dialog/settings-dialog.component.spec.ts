import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Action, ChosenTheme, DefaultActions, DisplayMode } from "@model";
import { ApiState, RoonState } from "@nihilux/roon-web-model";
import { DialogService } from "@services/dialog.service";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { SettingsDialogComponent } from "./settings-dialog.component";

describe("SettingsDialogComponent", () => {
  let selectedTab: number;
  let $chosenTheme: WritableSignal<string>;
  let $displayMode: WritableSignal<DisplayMode>;
  let $displayedZoneId: WritableSignal<string>;
  let $isBigFonts: WritableSignal<boolean>;
  let $isSmallScreen: WritableSignal<boolean>;
  let $isOneColumn: WritableSignal<boolean>;
  let $actions: WritableSignal<Action[]>;
  let $availableAction: WritableSignal<Action[]>;
  let $layoutClass: WritableSignal<string>;
  let $roonState: WritableSignal<ApiState>;
  let $showFullscreenToggle: WritableSignal<boolean>;
  let settingsService: {
    chosenTheme: Mock;
    saveChosenTheme: Mock;
    displayMode: Mock;
    displayedZoneId: Mock;
    saveDisplayMode: Mock;
    isSmallScreen: Mock;
    isOneColumn: Mock;
    actions: Mock;
    saveActions: Mock;
    availableActions: Mock;
    displayModeClass: Mock;
    isBigFonts: Mock;
    showFullscreenToggle: Mock;
  };
  let version: string;
  let dialogService: {
    open: Mock;
    close: Mock;
  };
  let roonService: {
    version: Mock;
    roonState: Mock;
  };
  let addPanelClass: Mock;
  let removePanelClass: Mock;
  let component: SettingsDialogComponent;
  let fixture: ComponentFixture<SettingsDialogComponent>;

  beforeEach(async () => {
    selectedTab = 0;
    $chosenTheme = signal(ChosenTheme.BROWSER);
    $displayMode = signal(DisplayMode.WIDE);
    $displayedZoneId = signal("zone_id");
    $isSmallScreen = signal(false);
    $isOneColumn = signal(false);
    $isBigFonts = signal(false);
    $actions = signal(DefaultActions);
    $availableAction = signal([]);
    $layoutClass = signal("wide");
    $roonState = signal({
      state: RoonState.SYNC,
      zones: [],
      outputs: [],
    });
    $showFullscreenToggle = signal(false);
    settingsService = {
      chosenTheme: vi.fn().mockImplementation(() => $chosenTheme),
      saveChosenTheme: vi.fn().mockImplementation((chosenTheme: ChosenTheme) => {
        $chosenTheme.set(chosenTheme);
      }),
      displayMode: vi.fn().mockImplementation(() => $displayMode),
      saveDisplayMode: vi.fn().mockImplementation((displayMode: DisplayMode) => {
        $displayMode.set(displayMode);
      }),
      displayedZoneId: vi.fn().mockImplementation(() => $displayedZoneId),
      isSmallScreen: vi.fn().mockImplementation(() => $isSmallScreen),
      isOneColumn: vi.fn().mockImplementation(() => $isOneColumn),
      actions: vi.fn().mockImplementation(() => $actions),
      saveActions: vi.fn().mockImplementation((actions: Action[]) => {
        $actions.set(actions);
      }),
      availableActions: vi.fn().mockImplementation(() => $availableAction),
      displayModeClass: vi.fn().mockImplementation(() => $layoutClass),
      isBigFonts: vi.fn().mockImplementation(() => $isBigFonts),
      showFullscreenToggle: vi.fn().mockImplementation(() => $showFullscreenToggle),
    };
    version = "version";
    roonService = {
      version: vi.fn().mockImplementation(() => version),
      roonState: vi.fn().mockImplementation(() => $roonState),
    };
    dialogService = {
      open: vi.fn(),
      close: vi.fn(),
    };
    addPanelClass = vi.fn();
    removePanelClass = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        MockProvider(MAT_DIALOG_DATA, { selectedTab }),
        MockProvider(DialogService, dialogService),
        MockProvider(SettingsService, settingsService),
        MockProvider(RoonService, roonService),
        MockProvider(MatDialogRef<SettingsDialogComponent>, {
          addPanelClass,
          removePanelClass,
        }),
      ],
      imports: [SettingsDialogComponent],
    });
    fixture = TestBed.createComponent(SettingsDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
