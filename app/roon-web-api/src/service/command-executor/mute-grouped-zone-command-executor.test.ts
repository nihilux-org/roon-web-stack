import {
  CommandType,
  FoundZone,
  MuteGroupedZoneCommand,
  MuteType,
  Output,
  OutputVolumeControl,
  RoonApiTransport,
  RoonMuteHow,
  RoonServer,
  Zone,
} from "@nihilux/roon-web-model";
import { executor } from "./mute-grouped-zone-command-executor";

describe("mute-groped-zone-command-executor.ts test suite", () => {
  let muteApi: jest.Mock;
  let server: RoonServer;
  let foundZone: FoundZone;
  beforeEach(() => {
    muteApi = jest.fn().mockImplementation(() => Promise.resolve());
    const roonApiTransport = {
      mute: muteApi,
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

  it("executor should call RoonApiTransoprt#mute with expected parameters", () => {
    const muteTypes = [MuteType.MUTE, MuteType.TOGGLE, MuteType.UN_MUTE];
    muteTypes
      .map(
        (type): MuteGroupedZoneCommand => ({
          type: CommandType.MUTE_GROUPED_ZONE,
          data: {
            zone_id,
            type,
          },
        })
      )
      .forEach((command) => {
        const expectedRoonMuteHow: RoonMuteHow = command.data.type === MuteType.UN_MUTE ? "unmute" : "mute";
        const executorPromise = executor(command, foundZone);
        void expect(executorPromise).resolves.toBeUndefined();
        expect(muteApi).toHaveBeenCalledTimes(2);
        expect(muteApi).toHaveBeenNthCalledWith(1, output, expectedRoonMuteHow);
        expect(muteApi).toHaveBeenNthCalledWith(2, other_output, expectedRoonMuteHow);
        muteApi.mockReset();
      });
  });

  it("executor should toggle mute state if called with MuteType.TOGGLE", () => {
    const muteCommand: MuteGroupedZoneCommand = {
      type: CommandType.MUTE_GROUPED_ZONE,
      data: {
        type: MuteType.TOGGLE,
        zone_id,
      },
    };
    void executor(muteCommand, foundZone);
    expect(muteApi).toHaveBeenCalledTimes(2);
    expect(muteApi).toHaveBeenNthCalledWith(1, output, "mute");
    expect(muteApi).toHaveBeenNthCalledWith(2, other_output, "mute");
    const mutedOutput = {
      output_id,
      volume: {
        is_muted: true,
      } as unknown as OutputVolumeControl,
    } as unknown as Output;
    const otherMutedOutput = {
      other_output_id,
      volume: {
        is_muted: true,
      } as unknown as OutputVolumeControl,
    } as unknown as Output;
    foundZone = {
      server,
      zone: {
        zone_id,
        outputs: [mutedOutput, otherMutedOutput, yet_another_output],
      } as unknown as Zone,
    };
    void executor(muteCommand, foundZone);
    expect(muteApi).toHaveBeenCalledTimes(4);
    expect(muteApi).toHaveBeenNthCalledWith(3, mutedOutput, "unmute");
    expect(muteApi).toHaveBeenNthCalledWith(4, otherMutedOutput, "unmute");
  });

  it("executor should wrap any error returned by RoonApiTransport#mute in  rejected Promise", () => {
    const error = new Error("error");
    muteApi.mockImplementation((o: Output) => {
      if (o.output_id === output_id) {
        return Promise.reject(error);
      } else {
        return Promise.resolve();
      }
    });
    const command: MuteGroupedZoneCommand = {
      type: CommandType.MUTE_GROUPED_ZONE,
      data: {
        zone_id,
        type: MuteType.TOGGLE,
      },
    };
    const executorPromise = executor(command, foundZone);
    void expect(executorPromise).rejects.toEqual(error);
  });
});

const zone_id = "zone_id";
const output_id = "output_id";
const other_output_id = "other_output_id";
const yet_another_output_id = "yet_another_output_id";

const output: Output = {
  output_id,
  volume: {
    is_muted: false,
  } as OutputVolumeControl,
} as unknown as Output;

const other_output: Output = {
  output_id: other_output_id,
  volume: {
    step: 3,
  },
} as unknown as Output;

const yet_another_output: Output = {
  output_id: yet_another_output_id,
} as unknown as Output;

const zone = {
  zone_id,
  outputs: [output, other_output, yet_another_output],
} as unknown as Zone;
