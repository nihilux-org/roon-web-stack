import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DisplayMode, ZoneCommands, ZoneCommandState } from "@model";
import { Command } from "@nihilux/roon-web-model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneCommandsComponent } from "./zone-commands.component";

describe("ZoneCommandsComponent", () => {
  let component: ZoneCommandsComponent;
  let fixture: ComponentFixture<ZoneCommandsComponent>;
  let commands: Command[];
  let roonService: {
    command: Mock;
  };
  let $isSmallScreen: WritableSignal<boolean>;
  let $displayMode: WritableSignal<DisplayMode>;
  let $zoneCommands: WritableSignal<ZoneCommands>;
  let settingsService: {
    isSmallScreen: Mock;
    displayMode: Mock;
  };

  beforeEach(async () => {
    commands = [];
    roonService = {
      command: vi.fn().mockImplementation((command: Command) => {
        commands.push(command);
      }),
    };
    $isSmallScreen = signal(false);
    $displayMode = signal(DisplayMode.COMPACT);
    settingsService = {
      isSmallScreen: vi.fn().mockImplementation(() => $isSmallScreen),
      displayMode: vi.fn().mockImplementation(() => $displayMode),
    };
    $zoneCommands = signal(ZONE_COMMANDS);
    TestBed.configureTestingModule({
      providers: [MockProvider(RoonService, roonService), MockProvider(SettingsService, settingsService)],
      imports: [ZoneCommandsComponent],
    });
    fixture = TestBed.createComponent(ZoneCommandsComponent);
    fixture.componentRef.setInput("$zoneCommands", $zoneCommands);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

const ZONE_COMMANDS: ZoneCommands = {
  zoneId: "zone_id",
  previousTrack: ZoneCommandState.ABSENT,
  loading: ZoneCommandState.ABSENT,
  pause: ZoneCommandState.ABSENT,
  play: ZoneCommandState.ABSENT,
  nextTrack: ZoneCommandState.ABSENT,
  stop: ZoneCommandState.ABSENT,
};
