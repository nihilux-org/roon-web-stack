import { MockBuilder, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { ChosenTheme, DisplayMode } from "@model/client";
import { SettingsService } from "@services/settings.service";
import { SettingsDialogComponent } from "./settings-dialog.component";

describe("SettingsDialogComponent", () => {
  let $chosenTheme: WritableSignal<string>;
  let $displayMode: WritableSignal<DisplayMode>;
  let $isSmallScreen: WritableSignal<boolean>;
  let settingsService: {
    chosenTheme: jest.Mock;
    saveIsDarkTheme: jest.Mock;
    displayMode: jest.Mock;
    saveDisplayMode: jest.Mock;
    isSmallScreen: jest.Mock;
  };
  let closeDialog: jest.Mock;
  let component: SettingsDialogComponent;
  let fixture: ComponentFixture<SettingsDialogComponent>;

  beforeEach(async () => {
    $chosenTheme = signal(ChosenTheme.BROWSER);
    $displayMode = signal(DisplayMode.WIDE);
    $isSmallScreen = signal(false);
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
    };
    closeDialog = jest.fn();
    await MockBuilder(SettingsDialogComponent)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .mock(MatDialogRef<SettingsDialogComponent>, {
        close: closeDialog,
      });
    fixture = MockRender(SettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
