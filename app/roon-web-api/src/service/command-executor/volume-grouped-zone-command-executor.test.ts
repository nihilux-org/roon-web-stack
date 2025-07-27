import {
  CommandType,
  FoundZone,
  Output,
  OutputVolumeControl,
  RoonApiTransport,
  RoonServer,
  VolumeGroupedZoneCommand,
  Zone,
} from "@nihilux/roon-web-model";
import { executor } from "./volume-grouped-zone-command-executor";

describe("volume-grouped-zone-command-executor.ts test suite", () => {
  let volumeApi: jest.Mock;
  let server: RoonServer;
  let foundZone: FoundZone;
  beforeEach(() => {
    volumeApi = jest.fn().mockImplementation(() => Promise.resolve());
    const roonApiTransport = {
      change_volume: volumeApi,
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

  it("executor should call RoonApiTransport#change_volume with the expected parameters", () => {
    const command: VolumeGroupedZoneCommand = {
      type: CommandType.VOLUME_GROUPED_ZONE,
      data: {
        zone_id,
        decrement: false,
      },
    };
    const executorPromise = executor(command, foundZone);
    void expect(executorPromise).resolves.toBeUndefined();
    expect(volumeApi).toHaveBeenCalledTimes(2);
    expect(volumeApi).toHaveBeenNthCalledWith(1, output, "relative", 1);
    expect(volumeApi).toHaveBeenNthCalledWith(2, other_output, "relative", other_output.volume?.step);

    command.data.decrement = true;
    const decrementExecutorPromise = executor(command, foundZone);
    void expect(decrementExecutorPromise).resolves.toBeUndefined();
    expect(volumeApi).toHaveBeenCalledTimes(4);
    expect(volumeApi).toHaveBeenNthCalledWith(3, output, "relative", -1);
    expect(volumeApi).toHaveBeenNthCalledWith(4, other_output, "relative", -1 * (other_output.volume?.step ?? 1));
  });

  it("executor should wrap any error returned by RoonApiTransport#change_volume in  rejected Promise", () => {
    const error = new Error("error");
    volumeApi.mockImplementation((o: Output) => {
      if (o.output_id === output_id) {
        return Promise.reject(error);
      } else {
        return Promise.resolve();
      }
    });
    const command: VolumeGroupedZoneCommand = {
      type: CommandType.VOLUME_GROUPED_ZONE,
      data: {
        zone_id,
        decrement: false,
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
