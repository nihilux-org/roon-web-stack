import { Mock } from "vitest";
import {
  CommandType,
  FoundZone,
  Output,
  OutputVolumeControl,
  RoonApiTransport,
  RoonChangeVolumeHow,
  RoonServer,
  VolumeCommand,
  VolumeStrategy,
  Zone,
} from "@nihilux/roon-web-model";
import { executor } from "./volume-command-executor";

describe("volume-command-executor.ts test suite", () => {
  let volumeApi: Mock;
  let server: RoonServer;
  let foundZone: FoundZone;
  beforeEach(() => {
    volumeApi = vi.fn().mockImplementation(() => Promise.resolve());
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
    vi.resetAllMocks();
  });

  it("executor should call RoonApiTransport#change_volume with the expected parameters", async () => {
    const expectedRoonChangeVolumeHows: Record<string, RoonChangeVolumeHow> = {
      ABSOLUTE: "absolute",
      RELATIVE: "relative",
      RELATIVE_STEP: "relative_step",
    };
    const volumeStrategies = [VolumeStrategy.ABSOLUTE, VolumeStrategy.RELATIVE, VolumeStrategy.RELATIVE_STEP];
    await Promise.all(
      volumeStrategies
        .map(
          (strategy): VolumeCommand => ({
            type: CommandType.VOLUME,
            data: {
              strategy,
              zone_id,
              output_id,
              value: 42,
            },
          })
        )
        .map(async (command) => {
          const expectedRoonChangeVolumeHow = expectedRoonChangeVolumeHows[command.data.strategy];
          const executorPromise = executor(command, foundZone);
          await expect(executorPromise).resolves.toBeUndefined();
          expect(volumeApi).toHaveBeenCalledWith(output, expectedRoonChangeVolumeHow, 42);
        })
    );
  });

  it("executor should do nothing when called with for an output which volume is fixed (without volume attribute)", async () => {
    const volumeStrategies = [VolumeStrategy.ABSOLUTE, VolumeStrategy.RELATIVE, VolumeStrategy.RELATIVE_STEP];
    await Promise.all(
      volumeStrategies
        .map(
          (strategy): VolumeCommand => ({
            type: CommandType.VOLUME,
            data: {
              strategy,
              zone_id,
              output_id: other_output_id,
              value: 42,
            },
          })
        )
        .map(async (command) => {
          const executorPromise = executor(command, foundZone);
          await expect(executorPromise).resolves.toBeUndefined();
          expect(volumeApi).toHaveBeenCalledTimes(0);
        })
    );
  });

  it("executor should return a rejected Promise when called with for an output which is not one of the zone outputs", async () => {
    const volumeStrategies = [VolumeStrategy.ABSOLUTE, VolumeStrategy.RELATIVE, VolumeStrategy.RELATIVE_STEP];
    await Promise.all(
      volumeStrategies
        .map(
          (strategy): VolumeCommand => ({
            type: CommandType.VOLUME,
            data: {
              strategy,
              zone_id,
              output_id: "unknown_output_id",
              value: 42,
            },
          })
        )
        .map(async (command) => {
          const error = new Error(
            `'${command.data.output_id}' is not a valid 'output_id' for zone '${command.data.zone_id}'`
          );
          const executorPromise = executor(command, foundZone);
          await expect(executorPromise).rejects.toEqual(error);
          expect(volumeApi).toHaveBeenCalledTimes(0);
        })
    );
  });

  it("executor should return a rejected Promise wrapping the error returned by RoonApiTransport#change_volume", async () => {
    const expectedRoonChangeVolumeHows: Record<string, RoonChangeVolumeHow> = {
      ABSOLUTE: "absolute",
      RELATIVE: "relative",
      RELATIVE_STEP: "relative_step",
    };
    const error = new Error("roon error");
    volumeApi.mockImplementation(() => Promise.reject(error));
    const volumeStrategies = [VolumeStrategy.ABSOLUTE, VolumeStrategy.RELATIVE, VolumeStrategy.RELATIVE_STEP];
    await Promise.all(
      volumeStrategies
        .map(
          (strategy): VolumeCommand => ({
            type: CommandType.VOLUME,
            data: {
              strategy,
              zone_id,
              output_id,
              value: 42,
            },
          })
        )
        .map(async (command, index) => {
          const expectedRoonChangeVolumeHow = expectedRoonChangeVolumeHows[command.data.strategy];
          const executorPromise = executor(command, foundZone);
          await expect(executorPromise).rejects.toEqual(error);
          expect(volumeApi).toHaveBeenNthCalledWith(index + 1, output, expectedRoonChangeVolumeHow, 42);
        })
    );
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
