import { MockBuilder, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Command, ZoneState } from "@model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneVolumeDialogComponent } from "./zone-volume-dialog.component";

describe("ZoneVolumeDialogComponent", () => {
  let $zone: WritableSignal<ZoneState>;
  let commands: Command[];
  let roonService: {
    command: jest.Mock;
    zoneState: jest.Mock;
  };
  let $displayedZoneId: WritableSignal<string>;
  let $isSmallScreen: WritableSignal<boolean>;
  let settingsService: {
    displayedZoneId: jest.Mock;
    isSmallScreen: jest.Mock;
  };
  let closeDialog: jest.Mock;
  let openTransferDialog: jest.Mock;
  let component: ZoneVolumeDialogComponent;
  let fixture: ComponentFixture<ZoneVolumeDialogComponent>;

  beforeEach(async () => {
    $zone = signal({
      outputs: [],
    } as unknown as ZoneState);
    commands = [];
    roonService = {
      command: jest.fn().mockImplementation((c: Command) => commands.push(c)),
      zoneState: jest.fn().mockImplementation(() => $zone),
    };
    $displayedZoneId = signal("zone_id");
    $isSmallScreen = signal(false);
    settingsService = {
      displayedZoneId: jest.fn().mockImplementation(() => $displayedZoneId),
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
    };
    closeDialog = jest.fn();
    openTransferDialog = jest.fn();
    await MockBuilder(ZoneVolumeDialogComponent)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .mock(MatDialogRef<ZoneVolumeDialogComponent>, {
        close: closeDialog,
      })
      .mock(MatDialog, {
        open: openTransferDialog,
      });

    fixture = MockRender(ZoneVolumeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
