import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Command } from "@model";
import { ZoneCommands, ZoneCommandState } from "@model/client";
import { RoonService } from "@services/roon.service";
import { ZoneCommandsComponent } from "./zone-commands.component";

describe("ZoneCommandsComponent", () => {
  let component: ZoneCommandsComponent;
  let fixture: MockedComponentFixture<ZoneCommandsComponent, { zoneCommands: ZoneCommands }>;
  let commands: Command[];
  let roonService: {
    command: jest.Mock;
  };

  beforeEach(async () => {
    commands = [];
    roonService = {
      command: jest.fn().mockImplementation((command: Command) => {
        commands.push(command);
      }),
    };
    await MockBuilder(ZoneCommandsComponent).mock(RoonService, roonService as Partial<RoonService>);
    fixture = MockRender(ZoneCommandsComponent, {
      zoneCommands: ZONE_COMMANDS,
    });
    component = fixture.componentInstance as ZoneCommandsComponent;
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
  outputs: [],
};
