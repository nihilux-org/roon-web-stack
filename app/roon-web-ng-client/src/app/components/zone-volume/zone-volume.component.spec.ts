import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { Output } from "@model";
import { SettingsService } from "@services/settings.service";
import { VolumeService } from "@services/volume.service";
import { ZoneVolumeComponent } from "./zone-volume.component";

describe("ZoneVolumeComponent", () => {
  let component: ZoneVolumeComponent;
  let fixture: MockedComponentFixture<ZoneVolumeComponent>;
  let $isSmallScreen: WritableSignal<boolean>;
  let settingsService: {
    isSmallScreen: jest.Mock;
  };
  let $outputs: WritableSignal<Output[]>;
  let $isMuted: WritableSignal<boolean>;
  let volumeService: {
    outputs: jest.Mock;
    isMute: jest.Mock;
  };

  beforeEach(async () => {
    $outputs = signal([]);
    $isSmallScreen = signal(false);
    settingsService = {
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
    };
    $isMuted = signal(false);
    $outputs = signal([]);
    volumeService = {
      outputs: jest.fn().mockImplementation(() => $outputs),
      isMute: jest.fn().mockImplementation(() => $isMuted),
    };
    await MockBuilder(ZoneVolumeComponent)
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
