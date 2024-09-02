import { MockBuilder, MockRender } from "ng-mocks";
import { Signal, signal, WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { Output } from "@model";
import { DialogService } from "@services/dialog.service";
import { SettingsService } from "@services/settings.service";
import { VolumeService } from "@services/volume.service";
import { ZoneVolumeDialogComponent } from "./zone-volume-dialog.component";

describe("ZoneVolumeDialogComponent", () => {
  let $isSmallScreen: WritableSignal<boolean>;
  let $outputs: Signal<Output[]>;
  let $canGroup: Signal<boolean>;
  let $isGroup: Signal<boolean>;
  let $isGroupedZoneMute: Signal<boolean>;
  let dialogService: {
    open: jest.Mock;
  };
  let settingsService: {
    isSmallScreen: jest.Mock;
  };
  let volumeService: {
    outputs: jest.Mock;
    canGroup: jest.Mock;
    isGrouped: jest.Mock;
    isGroupedZoneMute: jest.Mock;
  };
  let component: ZoneVolumeDialogComponent;
  let fixture: ComponentFixture<ZoneVolumeDialogComponent>;

  beforeEach(async () => {
    $isSmallScreen = signal(false);
    $outputs = signal([]);
    $canGroup = signal(false);
    $isGroup = signal(false);
    $isGroupedZoneMute = signal(false);
    dialogService = {
      open: jest.fn(),
    };
    settingsService = {
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
    };
    volumeService = {
      outputs: jest.fn().mockImplementation(() => $outputs),
      canGroup: jest.fn().mockImplementation(() => $canGroup),
      isGrouped: jest.fn().mockImplementation(() => $isGroup),
      isGroupedZoneMute: jest.fn().mockImplementation(() => $isGroupedZoneMute),
    };
    await MockBuilder(ZoneVolumeDialogComponent)
      .mock(DialogService, dialogService as Partial<DialogService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .mock(VolumeService, volumeService as Partial<VolumeService>);

    fixture = MockRender(ZoneVolumeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
