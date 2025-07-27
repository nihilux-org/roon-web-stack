import {
  CommandType,
  ControlCommand,
  FoundZone,
  RoonApiTransport,
  RoonApiTransportControl,
  RoonServer,
  Zone,
} from "@nihilux/roon-web-model";
import { executor } from "./control-command-executor";

describe("control-command.ts test suite", () => {
  let controlApi: jest.Mock;
  let server: RoonServer;
  let foundZone: FoundZone;
  beforeEach(() => {
    controlApi = jest.fn().mockImplementation(() => Promise.resolve());
    const roonApiTransport = {
      control: controlApi,
    } as unknown as RoonApiTransport;
    server = {
      services: {
        RoonApiTransport: roonApiTransport,
      },
    } as unknown as RoonServer;
    foundZone = {
      zone,
      server,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("executor should call RoonApiTransport#control method with expected zone and expected action", () => {
    const expectedRoonControls: Record<string, RoonApiTransportControl> = {
      PLAY: "play",
      PAUSE: "pause",
      PLAY_PAUSE: "playpause",
      STOP: "stop",
      NEXT: "next",
      PREVIOUS: "previous",
    };
    const controlCommandTypes: (
      | CommandType.PLAY
      | CommandType.PAUSE
      | CommandType.PLAY_PAUSE
      | CommandType.STOP
      | CommandType.NEXT
      | CommandType.PREVIOUS
    )[] = [
      CommandType.PLAY,
      CommandType.PAUSE,
      CommandType.PLAY_PAUSE,
      CommandType.STOP,
      CommandType.NEXT,
      CommandType.PREVIOUS,
    ];
    controlCommandTypes
      .map(
        (type): ControlCommand => ({
          type,
          data: {
            zone_id: zone.zone_id,
          },
        })
      )
      .forEach((command) => {
        const expectedRoonControl = expectedRoonControls[command.type];
        const executorPromise = executor(command, foundZone);
        void expect(executorPromise).resolves.toBeUndefined();
        expect(controlApi).toHaveBeenCalledWith(zone, expectedRoonControl);
      });
  });
});

const zone = {
  zone_id: "zone_id",
} as unknown as Zone;
