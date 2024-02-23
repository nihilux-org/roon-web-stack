import { MockBuilder, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { CHOSEN_THEME } from "@model/client";
import { SettingsService } from "@services/settings.service";
import { SettingsDialogComponent } from "./settings-dialog.component";

describe("SettingsDialogComponent", () => {
  let $chosenTheme: WritableSignal<string>;
  let settingsService: {
    chosenTheme: jest.Mock;
    saveIsDarkTheme: jest.Mock;
  };
  let closeDialog: jest.Mock;
  let component: SettingsDialogComponent;
  let fixture: ComponentFixture<SettingsDialogComponent>;

  beforeEach(async () => {
    $chosenTheme = signal(CHOSEN_THEME.BROWSER);
    settingsService = {
      chosenTheme: jest.fn().mockImplementation(() => $chosenTheme),
      saveIsDarkTheme: jest.fn().mockImplementation((chosenTheme: CHOSEN_THEME) => {
        $chosenTheme.set(chosenTheme);
      }),
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
