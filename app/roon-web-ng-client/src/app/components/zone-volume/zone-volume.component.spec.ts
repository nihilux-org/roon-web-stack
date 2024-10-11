import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { Output } from "@model";
import { DisplayMode } from "@model/client";
import { DialogService } from "@services/dialog.service";
import { SettingsService } from "@services/settings.service";
import { VolumeService } from "@services/volume.service";
import { ZoneVolumeComponent } from "./zone-volume.component";

describe("ZoneVolumeComponent", () => {
  let component: ZoneVolumeComponent;
  let fixture: MockedComponentFixture<ZoneVolumeComponent>;
  let $displayMode: WritableSignal<DisplayMode>;
  let $isSmallScreen: WritableSignal<boolean>;
  let settingsService: {
    isSmallScreen: jest.Mock;
    displayMode: jest.Mock;
  };
  let $outputs: WritableSignal<Output[]>;
  let $isMuted: WritableSignal<boolean>;
  let volumeService: {
    outputs: jest.Mock;
    isMute: jest.Mock;
  };
  let dialogService: {
    open: jest.Mock;
  };

  beforeEach(async () => {
    $outputs = signal([]);
    $displayMode = signal(DisplayMode.WIDE);
    $isSmallScreen = signal(false);
    settingsService = {
      displayMode: jest.fn().mockImplementation(() => $displayMode),
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
    };
    $isMuted = signal(false);
    $outputs = signal([]);
    volumeService = {
      outputs: jest.fn().mockImplementation(() => $outputs),
      isMute: jest.fn().mockImplementation(() => $isMuted),
    };
    dialogService = {
      open: jest.fn(),
    };
    await MockBuilder(ZoneVolumeComponent)
      .mock(DialogService, dialogService as Partial<DialogService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .mock(VolumeService, volumeService as Partial<VolumeService>);
    fixture = MockRender(ZoneVolumeComponent);
    component = fixture.componentInstance as ZoneVolumeComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
