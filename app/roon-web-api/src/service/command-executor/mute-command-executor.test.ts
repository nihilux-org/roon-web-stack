import {
  CommandType,
  FoundZone,
  MuteCommand,
  MuteType,
  Output,
  OutputVolumeControl,
  RoonApiTransport,
  RoonMuteHow,
  RoonServer,
  Zone,
} from "@nihilux/roon-web-model";
import { executor } from "./mute-command-executor";

describe("mute-command-executor.ts test suite", () => {
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

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("executor should call RoonApiTransoprt#mute with expected parameters", () => {
    const muteTypes = [MuteType.MUTE, MuteType.TOGGLE, MuteType.UN_MUTE];
    muteTypes
      .map(
        (type): MuteCommand => ({
          type: CommandType.MUTE,
          data: {
            type,
            zone_id,
            output_id,
          },
        })
      )
      .forEach((command) => {
        const expectedRoonMuteHow: RoonMuteHow = command.data.type === MuteType.UN_MUTE ? "unmute" : "mute";
        const executorPromise = executor(command, foundZone);
        void expect(executorPromise).resolves.toBeUndefined();
        expect(muteApi).toHaveBeenCalledWith(output, expectedRoonMuteHow);
      });
  });

  it("executor should toggle mute state if called with MuteType.TOGGLE", () => {
    const muteCommand: MuteCommand = {
      type: CommandType.MUTE,
      data: {
        type: MuteType.TOGGLE,
        zone_id,
        output_id,
      },
    };
    void executor(muteCommand, foundZone);
    expect(muteApi).toHaveBeenCalledWith(output, "mute");
    const mutedOutput = {
      output_id,
      volume: {
        is_muted: true,
      } as unknown as OutputVolumeControl,
    } as unknown as Output;
    foundZone = {
      server,
      zone: {
        zone_id,
        outputs: [mutedOutput],
      } as unknown as Zone,
    };
    void executor(muteCommand, foundZone);
    expect(muteApi).toHaveBeenNthCalledWith(2, mutedOutput, "unmute");
  });

  it("executor should do nothing when called with for an output which volume is fixed (without volume attribute)", () => {
    const muteTypes = [MuteType.MUTE, MuteType.TOGGLE, MuteType.UN_MUTE];
    muteTypes
      .map(
        (type): MuteCommand => ({
          type: CommandType.MUTE,
          data: {
            type,
            zone_id,
            output_id: other_output_id,
          },
        })
      )
      .forEach((command) => {
        const executorPromise = executor(command, foundZone);
        void expect(executorPromise).resolves.toBeUndefined();
        expect(muteApi).toHaveBeenCalledTimes(0);
      });
  });

  it("executor should return a rejected Promise when called with for an output which which is not one of the zone outputs", () => {
    const muteTypes = [MuteType.MUTE, MuteType.TOGGLE, MuteType.UN_MUTE];
    muteTypes
      .map(
        (type): MuteCommand => ({
          type: CommandType.MUTE,
          data: {
            type,
            zone_id,
            output_id: "unknown_output_id",
          },
        })
      )
      .forEach((command) => {
        const error = new Error(
          `'${command.data.output_id}' is not a valid 'output_id' for zone '${command.data.zone_id}'`
        );
        const executorPromise = executor(command, foundZone);
        void expect(executorPromise).rejects.toEqual(error);
        expect(muteApi).toHaveBeenCalledTimes(0);
      });
  });

  it("executor should return a rejected Promise wrapping the error returned by RoonApiTransport#mute", () => {
    const error = new Error("roon error");
    muteApi.mockImplementation(() => Promise.reject(error));
    const muteTypes = [MuteType.MUTE, MuteType.TOGGLE, MuteType.UN_MUTE];
    muteTypes
      .map(
        (type): MuteCommand => ({
          type: CommandType.MUTE,
          data: {
            type,
            zone_id,
            output_id,
          },
        })
      )
      .forEach((command, index) => {
        const executorPromise = executor(command, foundZone);
        const expectedRoonMuteHow: RoonMuteHow = command.data.type === MuteType.UN_MUTE ? "unmute" : "mute";
        void expect(executorPromise).rejects.toEqual(error);
        expect(muteApi).toHaveBeenNthCalledWith(index + 1, output, expectedRoonMuteHow);
      });
  });
});

const zone_id = "zone_id";
const output_id = "output_id";
const other_output_id = "other_output_id";

const output: Output = {
  output_id,
  volume: {
    is_muted: false,
  } as OutputVolumeControl,
} as unknown as Output;

const other_output: Output = {
  output_id: other_output_id,
} as unknown as Output;

const zone = {
  zone_id,
  outputs: [output, other_output],
} as unknown as Zone;
