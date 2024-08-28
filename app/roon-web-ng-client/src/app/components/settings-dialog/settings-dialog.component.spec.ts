import { MockBuilder, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatTab } from "@angular/material/tabs";
import { Action, ChosenTheme, DefaultActions, DisplayMode } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { SettingsDialogComponent } from "./settings-dialog.component";

describe("SettingsDialogComponent", () => {
  let selectedTab: number;
  let $chosenTheme: WritableSignal<string>;
  let $displayMode: WritableSignal<DisplayMode>;
  let $isSmallScreen: WritableSignal<boolean>;
  let $isOneColumn: WritableSignal<boolean>;
  let $actions: WritableSignal<Action[]>;
  let $availableAction: WritableSignal<Action[]>;
  let $layoutClass: WritableSignal<string>;
  let displayModeClasses: string[];
  let settingsService: {
    chosenTheme: jest.Mock;
    saveIsDarkTheme: jest.Mock;
    displayMode: jest.Mock;
    saveDisplayMode: jest.Mock;
    isSmallScreen: jest.Mock;
    isOneColumn: jest.Mock;
    actions: jest.Mock;
    saveActions: jest.Mock;
    availableActions: jest.Mock;
    displayModeClass: jest.Mock;
    displayModeClasses: jest.Mock;
  };
  let version: string;
  let roonService: {
    version: jest.Mock;
  };
  let closeDialog: jest.Mock;
  let addPanelClass: jest.Mock;
  let removePanelClass: jest.Mock;
  let component: SettingsDialogComponent;
  let fixture: ComponentFixture<SettingsDialogComponent>;

  beforeEach(async () => {
    selectedTab = 0;
    $chosenTheme = signal(ChosenTheme.BROWSER);
    $displayMode = signal(DisplayMode.WIDE);
    $isSmallScreen = signal(false);
    $isOneColumn = signal(false);
    $actions = signal(DefaultActions);
    $availableAction = signal([]);
    $layoutClass = signal("wide");
    displayModeClasses = ["wide", "one-column", "compact"];
    settingsService = {
      chosenTheme: jest.fn().mockImplementation(() => $chosenTheme),
      saveIsDarkTheme: jest.fn().mockImplementation((chosenTheme: ChosenTheme) => {
        $chosenTheme.set(chosenTheme);
      }),
      displayMode: jest.fn().mockImplementation(() => $displayMode),
      saveDisplayMode: jest.fn().mockImplementation((displayMode: DisplayMode) => {
        $displayMode.set(displayMode);
      }),
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
      isOneColumn: jest.fn().mockImplementation(() => $isOneColumn),
      actions: jest.fn().mockImplementation(() => $actions),
      saveActions: jest.fn().mockImplementation((actions: Action[]) => {
        $actions.set(actions);
      }),
      availableActions: jest.fn().mockImplementation(() => $availableAction),
      displayModeClass: jest.fn().mockImplementation(() => $layoutClass),
      displayModeClasses: jest.fn().mockImplementation(() => displayModeClasses),
    };
    version = "version";
    roonService = {
      version: jest.fn().mockImplementation(() => version),
    };
    closeDialog = jest.fn();
    addPanelClass = jest.fn();
    removePanelClass = jest.fn();
    await MockBuilder(SettingsDialogComponent)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(MatDialogRef<SettingsDialogComponent>, {
        close: closeDialog,
        addPanelClass,
        removePanelClass,
      })
      .mock(MAT_DIALOG_DATA, { selectedTab })
      .keep(MatTab);
    fixture = MockRender(SettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
