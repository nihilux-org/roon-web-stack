import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Command } from "@model";
import { DEFAULT_ZONE_COMMANDS, ZoneCommands } from "@model/client";
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
      zoneCommands: DEFAULT_ZONE_COMMANDS,
    });
    component = fixture.componentInstance as ZoneCommandsComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
