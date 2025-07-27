import { MockProvider } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Action, ChosenTheme, DefaultActions, DisplayMode } from "@model";
import { DialogService } from "@services/dialog.service";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { SettingsDialogComponent } from "./settings-dialog.component";

describe("SettingsDialogComponent", () => {
  let selectedTab: number;
  let $chosenTheme: WritableSignal<string>;
  let $displayMode: WritableSignal<DisplayMode>;
  let $isBigFonts: WritableSignal<boolean>;
  let $isSmallScreen: WritableSignal<boolean>;
  let $isOneColumn: WritableSignal<boolean>;
  let $actions: WritableSignal<Action[]>;
  let $availableAction: WritableSignal<Action[]>;
  let $layoutClass: WritableSignal<string>;
  let settingsService: {
    chosenTheme: jest.Mock;
    saveChosenTheme: jest.Mock;
    displayMode: jest.Mock;
    saveDisplayMode: jest.Mock;
    isSmallScreen: jest.Mock;
    isOneColumn: jest.Mock;
    actions: jest.Mock;
    saveActions: jest.Mock;
    availableActions: jest.Mock;
    displayModeClass: jest.Mock;
    isBigFonts: jest.Mock;
  };
  let version: string;
  let dialogService: {
    open: jest.Mock;
    close: jest.Mock;
  };
  let roonService: {
    version: jest.Mock;
  };
  let addPanelClass: jest.Mock;
  let removePanelClass: jest.Mock;
  let component: SettingsDialogComponent;
  let fixture: ComponentFixture<SettingsDialogComponent>;

  beforeEach(() => {
    selectedTab = 0;
    $chosenTheme = signal(ChosenTheme.BROWSER);
    $displayMode = signal(DisplayMode.WIDE);
    $isSmallScreen = signal(false);
    $isOneColumn = signal(false);
    $isBigFonts = signal(false);
    $actions = signal(DefaultActions);
    $availableAction = signal([]);
    $layoutClass = signal("wide");
    settingsService = {
      chosenTheme: jest.fn().mockImplementation(() => $chosenTheme),
      saveChosenTheme: jest.fn().mockImplementation((chosenTheme: ChosenTheme) => {
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
      isBigFonts: jest.fn().mockImplementation(() => $isBigFonts),
    };
    version = "version";
    roonService = {
      version: jest.fn().mockImplementation(() => version),
    };
    dialogService = {
      open: jest.fn(),
      close: jest.fn(),
    };
    addPanelClass = jest.fn();
    removePanelClass = jest.fn();
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
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
