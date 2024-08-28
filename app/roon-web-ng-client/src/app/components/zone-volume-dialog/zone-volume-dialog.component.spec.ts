import { MockBuilder, MockRender } from "ng-mocks";
import { Signal, signal, WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Output } from "@model";
import { SettingsService } from "@services/settings.service";
import { VolumeService } from "@services/volume.service";
import { ZoneVolumeDialogComponent } from "./zone-volume-dialog.component";

describe("ZoneVolumeDialogComponent", () => {
  let $isSmallScreen: WritableSignal<boolean>;
  let settingsService: {
    isSmallScreen: jest.Mock;
  };
  let $outputs: Signal<Output[]>;
  let $canGroup: Signal<boolean>;
  let $isGroup: Signal<boolean>;
  let $isGroupedZoneMute: Signal<boolean>;
  let volumeService: {
    outputs: jest.Mock;
    canGroup: jest.Mock;
    isGrouped: jest.Mock;
    isGroupedZoneMute: jest.Mock;
  };
  let closeDialog: jest.Mock;
  let openTransferDialog: jest.Mock;
  let component: ZoneVolumeDialogComponent;
  let fixture: ComponentFixture<ZoneVolumeDialogComponent>;

  beforeEach(async () => {
    $isSmallScreen = signal(false);
    settingsService = {
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
    };
    $outputs = signal([]);
    $canGroup = signal(false);
    $isGroup = signal(false);
    $isGroupedZoneMute = signal(false);
    volumeService = {
      outputs: jest.fn().mockImplementation(() => $outputs),
      canGroup: jest.fn().mockImplementation(() => $canGroup),
      isGrouped: jest.fn().mockImplementation(() => $isGroup),
      isGroupedZoneMute: jest.fn().mockImplementation(() => $isGroupedZoneMute),
    };
    closeDialog = jest.fn();
    openTransferDialog = jest.fn();
    await MockBuilder(ZoneVolumeDialogComponent)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .mock(VolumeService, volumeService as Partial<VolumeService>)
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
