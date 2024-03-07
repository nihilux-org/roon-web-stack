import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ZoneCommands, ZoneCommandState } from "@model/client";
import { SettingsService } from "@services/settings.service";
import { ZoneVolumeComponent } from "./zone-volume.component";

describe("ZoneVolumeComponent", () => {
  let component: ZoneVolumeComponent;
  let fixture: MockedComponentFixture<ZoneVolumeComponent, { zoneCommands: ZoneCommands }>;
  let zoneCommands: ZoneCommands;
  let $isSmallScreen: WritableSignal<boolean>;
  let settingsService: {
    isSmallScreen: jest.Mock;
  };

  beforeEach(async () => {
    zoneCommands = {
      zoneId: "zone_id",
      previousTrack: ZoneCommandState.ABSENT,
      loading: ZoneCommandState.ABSENT,
      pause: ZoneCommandState.ABSENT,
      play: ZoneCommandState.ABSENT,
      nextTrack: ZoneCommandState.ABSENT,
      outputs: [],
    };
    $isSmallScreen = signal(false);
    settingsService = {
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
    };
    await MockBuilder(ZoneVolumeComponent).mock(SettingsService, settingsService as Partial<SettingsService>);
    fixture = MockRender(ZoneVolumeComponent, {
      zoneCommands,
    });
    component = fixture.componentInstance as ZoneVolumeComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
