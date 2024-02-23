import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Command, CommandType, Output, VolumeCommand } from "@model";
import { RoonService } from "@services/roon.service";
import { ZoneVolumeComponent } from "./zone-volume.component";

describe("ZoneVolumeComponent", () => {
  let component: ZoneVolumeComponent;
  let fixture: MockedComponentFixture<ZoneVolumeComponent, { outputs: Output[] }>;
  let commands: VolumeCommand[];
  let outputs: Output[];
  let roonService: {
    volume: jest.Mock;
  };

  beforeEach(async () => {
    commands = [];
    outputs = [];
    roonService = {
      volume: jest.fn().mockImplementation((command: Command) => {
        if (command.type === CommandType.VOLUME) {
          commands.push(command);
        }
      }),
    };
    await MockBuilder(ZoneVolumeComponent).mock(RoonService, roonService as Partial<RoonService>);
    fixture = MockRender(ZoneVolumeComponent, {
      outputs,
    });
    component = fixture.componentInstance as ZoneVolumeComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
