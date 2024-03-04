import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { Command, CommandType, VolumeCommand } from "@model";
import { ZoneCommands, ZoneCommandState } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneVolumeComponent } from "./zone-volume.component";

describe("ZoneVolumeComponent", () => {
  let component: ZoneVolumeComponent;
  let fixture: MockedComponentFixture<ZoneVolumeComponent, { zoneCommands: ZoneCommands }>;
  let commands: VolumeCommand[];
  let zoneCommands: ZoneCommands;
  let roonService: {
    volume: jest.Mock;
  };
  let $isSmallScreen: WritableSignal<boolean>;
  let settingsService: {
    isSmallScreen: jest.Mock;
  };

  beforeEach(async () => {
    commands = [];
    zoneCommands = {
      zoneId: "zone_id",
      previousTrack: ZoneCommandState.ABSENT,
      loading: ZoneCommandState.ABSENT,
      pause: ZoneCommandState.ABSENT,
      play: ZoneCommandState.ABSENT,
      nextTrack: ZoneCommandState.ABSENT,
      outputs: [],
    };
    roonService = {
      volume: jest.fn().mockImplementation((command: Command) => {
        if (command.type === CommandType.VOLUME) {
          commands.push(command);
        }
      }),
    };
    $isSmallScreen = signal(false);
    settingsService = {
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
    };
    await MockBuilder(ZoneVolumeComponent)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>);
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
