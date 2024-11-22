import { MockProvider } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Command } from "@model";
import { DisplayMode, ZoneCommands, ZoneCommandState } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneCommandsComponent } from "./zone-commands.component";

describe("ZoneCommandsComponent", () => {
  let component: ZoneCommandsComponent;
  let fixture: ComponentFixture<ZoneCommandsComponent>;
  let commands: Command[];
  let roonService: {
    command: jest.Mock;
  };
  let $isSmallScreen: WritableSignal<boolean>;
  let $displayMode: WritableSignal<DisplayMode>;
  let $zoneCommands: WritableSignal<ZoneCommands>;
  let settingsService: {
    isSmallScreen: jest.Mock;
    displayMode: jest.Mock;
  };

  beforeEach(() => {
    commands = [];
    roonService = {
      command: jest.fn().mockImplementation((command: Command) => {
        commands.push(command);
      }),
    };
    $isSmallScreen = signal(false);
    $displayMode = signal(DisplayMode.COMPACT);
    settingsService = {
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
      displayMode: jest.fn().mockImplementation(() => $displayMode),
    };
    $zoneCommands = signal(ZONE_COMMANDS);
    TestBed.configureTestingModule({
      providers: [MockProvider(RoonService, roonService), MockProvider(SettingsService, settingsService)],
      imports: [ZoneCommandsComponent],
    });
    fixture = TestBed.createComponent(ZoneCommandsComponent);
    fixture.componentRef.setInput("$zoneCommands", $zoneCommands);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
};
