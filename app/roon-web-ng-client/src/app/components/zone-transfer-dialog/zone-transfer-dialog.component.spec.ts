import { MockBuilder, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { Command, ZoneDescription } from "@model";
import { CommandCallback } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneTransferDialogComponent } from "./zone-transfer-dialog.component";

describe("ZoneTransferDialogComponent", () => {
  let $zones: WritableSignal<ZoneDescription[]>;
  let $displayedZoneId: WritableSignal<string>;
  let commands: Command[];
  let commandCallbacks: CommandCallback[];
  let roonService: {
    zones: jest.Mock;
    command: jest.Mock;
  };
  let settingsService: {
    displayedZoneId: jest.Mock;
    saveDisplayedZoneId: jest.Mock;
  };
  let closeDialog: jest.Mock;
  let component: ZoneTransferDialogComponent;
  let fixture: ComponentFixture<ZoneTransferDialogComponent>;

  beforeEach(async () => {
    $zones = signal([]);
    $displayedZoneId = signal("zone_id");
    commands = [];
    commandCallbacks = [];
    roonService = {
      zones: jest.fn().mockImplementation(() => $zones),
      command: jest.fn().mockImplementation((command: Command, callback: CommandCallback) => {
        commands.push(command);
        commandCallbacks.push(callback);
      }),
    };
    settingsService = {
      displayedZoneId: jest.fn().mockImplementation(() => $displayedZoneId),
      saveDisplayedZoneId: jest.fn().mockImplementation((zone_id: string) => {
        $displayedZoneId.set(zone_id);
      }),
    };
    closeDialog = jest.fn();
    await MockBuilder(ZoneTransferDialogComponent)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .mock(MatDialogRef<ZoneTransferDialogComponent>, {
        close: closeDialog,
      });
    fixture = MockRender(ZoneTransferDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
