import { Mock } from "vitest";
import {
  FoundZone,
  InternalCommandType,
  Output,
  RoonApiTransport,
  RoonPlaybackState,
  RoonServer,
  Zone,
} from "@nihilux/roon-web-model";
import { internalExecutor } from "./queue-bot-internal-command-executor";

describe("queue-bot-command-executor test suite", () => {
  let control: Mock;
  let standby: Mock;
  let server: RoonServer;
  let foundZone: FoundZone;
  beforeEach(() => {
    control = vi.fn(() => Promise.resolve());
    standby = vi.fn(() => Promise.resolve());
    const roonApiTransport: RoonApiTransport = {
      control,
      standby,
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

  it(
    "internalExecutor should call RoonApiTransport#control with 'stop' then call RoonApiTransport#control with 'next' " +
      "then call RoonApiTransport#control with 'stop' and return for StopNextCommand if given is playing and next is allowed",
    async () => {
      const command = {
        type: InternalCommandType.STOP_NEXT,
        data: {
          zone_id,
        },
      };
      await internalExecutor(command, foundZone);
      expect(control).toHaveBeenCalledTimes(3);
      expect(control).toHaveBeenNthCalledWith(1, zone, "pause");
      expect(control).toHaveBeenNthCalledWith(2, zone, "next");
      expect(control).toHaveBeenNthCalledWith(3, zone, "stop");
      expect(standby).not.toHaveBeenCalled();
    }
  );

  it(
    "internalExecutor should call RoonApiTransport#control with 'stop' and return a failed promise without calling others" +
      "RoonApiTransport#control for StopNextCommand if given is playing and the 'stop' call failed",
    async () => {
      const error = new Error("error");
      control.mockImplementationOnce(() => Promise.reject(error));
      const command = {
        type: InternalCommandType.STOP_NEXT,
        data: {
          zone_id,
        },
      };
      const executorPromise = internalExecutor(command, foundZone);
      await expect(executorPromise).rejects.toBe(error);
      expect(control).toHaveBeenCalledTimes(1);
      expect(control).toHaveBeenNthCalledWith(1, zone, "pause");
      expect(standby).not.toHaveBeenCalled();
    }
  );

  it(
    "internalExecutor should call RoonApiTransport#control with 'stop' then call RoonApiTransport#control with 'next' " +
      "and return a failed promise without calling others RoonApiTransport#control for StopNextCommand if given is playing and the 'next' call failed",
    async () => {
      const error = new Error("error");
      control.mockImplementationOnce(() => Promise.resolve()).mockImplementationOnce(() => Promise.reject(error));
      const command = {
        type: InternalCommandType.STOP_NEXT,
        data: {
          zone_id,
        },
      };
      try {
        await internalExecutor(command, foundZone);
      } catch (e: unknown) {
        expect(e).toBe(error);
      }
      expect(control).toHaveBeenCalledTimes(2);
      expect(control).toHaveBeenNthCalledWith(1, zone, "pause");
      expect(control).toHaveBeenNthCalledWith(2, zone, "next");
      expect(standby).not.toHaveBeenCalled();
    }
  );

  it(
    "internalExecutor should call RoonApiTransport#control with 'stop' then call RoonApiTransport#control with 'next' " +
      "then call RoonApiTransport#control with 'stop' and return a failed Promise for StopNextCommand if given is playing and next is allowed and `stop` failed",
    async () => {
      const error = new Error("error");
      control
        .mockImplementationOnce(() => Promise.resolve())
        .mockImplementationOnce(() => Promise.resolve())
        .mockImplementationOnce(() => Promise.reject(error));
      const command = {
        type: InternalCommandType.STOP_NEXT,
        data: {
          zone_id,
        },
      };
      try {
        await internalExecutor(command, foundZone);
      } catch (e: unknown) {
        expect(e).toBe(error);
      }
      expect(control).toHaveBeenCalledTimes(3);
      expect(control).toHaveBeenNthCalledWith(1, zone, "pause");
      expect(control).toHaveBeenNthCalledWith(2, zone, "next");
      expect(control).toHaveBeenNthCalledWith(3, zone, "stop");
      expect(standby).not.toHaveBeenCalled();
    }
  );

  it("internalExecutor should skip QueueBot track for StopNextCommand if given zone is not playing", async () => {
    const ignoredStates: RoonPlaybackState[] = ["paused", "loading", "stopped"];
    for (const state of ignoredStates) {
      try {
        zone.state = state;

        const command = {
          type: InternalCommandType.STOP_NEXT,
          data: {
            zone_id,
          },
        };
        await internalExecutor(command, foundZone);
        expect(control).toHaveBeenNthCalledWith(1, zone, "next");
        expect(control).toHaveBeenNthCalledWith(2, zone, "stop");
        expect(standby).not.toHaveBeenCalled();
      } finally {
        zone.state = "playing";
      }
    }
  });

  it(
    "internalExecutor should call RoonApiTransport#control with 'stop' then call RoonApiTransport#control with 'next' " +
      "then call RoonApiTransport#control with 'stop', then call RoonApiTransport#standby for each output source_controls supporting standby and return " +
      "for StandbyNextCommand if given is playing and next is allowed",
    async () => {
      const command = {
        type: InternalCommandType.STANDBY_NEXT,
        data: {
          zone_id,
        },
      };
      await internalExecutor(command, foundZone);
      expect(control).toHaveBeenCalledTimes(3);
      expect(control).toHaveBeenNthCalledWith(1, zone, "pause");
      expect(control).toHaveBeenNthCalledWith(2, zone, "next");
      expect(control).toHaveBeenNthCalledWith(3, zone, "stop");
      expect(standby).toHaveBeenCalledTimes(3);
      expect(standby).toHaveBeenNthCalledWith(1, output, { control_key: "1" });
      expect(standby).toHaveBeenNthCalledWith(2, output, { control_key: "2" });
      expect(standby).toHaveBeenNthCalledWith(3, other_output, { control_key: "1" });
    }
  );

  it(
    "internalExecutor should call RoonApiTransport#control with 'stop' and return a failed promise without calling others" +
      "RoonApiTransport#control nor RoonApiTransport#standby for StandbyNextCommand if given is playing and the 'stop' call failed",
    async () => {
      const error = new Error("error");
      control.mockImplementationOnce(() => Promise.reject(error));
      const command = {
        type: InternalCommandType.STANDBY_NEXT,
        data: {
          zone_id,
        },
      };
      const executorPromise = internalExecutor(command, foundZone);
      await expect(executorPromise).rejects.toBe(error);
      expect(control).toHaveBeenCalledTimes(1);
      expect(control).toHaveBeenNthCalledWith(1, zone, "pause");
      expect(standby).not.toHaveBeenCalled();
    }
  );

  it(
    "internalExecutor should call RoonApiTransport#control with 'stop' then call RoonApiTransport#control with 'next' " +
      "and return a failed promise without calling others RoonApiTransport#control nor RoonApiTransport#standby " +
      "for StandbyNextCommand if given is playing and the 'next' call failed",
    async () => {
      const error = new Error("error");
      control.mockImplementationOnce(() => Promise.resolve()).mockImplementationOnce(() => Promise.reject(error));
      const command = {
        type: InternalCommandType.STANDBY_NEXT,
        data: {
          zone_id,
        },
      };
      try {
        await internalExecutor(command, foundZone);
      } catch (e: unknown) {
        expect(e).toBe(error);
      }
      expect(control).toHaveBeenCalledTimes(2);
      expect(control).toHaveBeenNthCalledWith(1, zone, "pause");
      expect(control).toHaveBeenNthCalledWith(2, zone, "next");
      expect(standby).not.toHaveBeenCalled();
    }
  );

  it(
    "internalExecutor should call RoonApiTransport#control with 'stop' then call RoonApiTransport#control with 'next' " +
      "then call RoonApiTransport#control with 'stop' and return a failed Promise without calling RoonApiTransport#standby " +
      "for StandbyNextCommand if given is playing and next is allowed and `stop` failed",
    async () => {
      const error = new Error("error");
      control
        .mockImplementationOnce(() => Promise.resolve())
        .mockImplementationOnce(() => Promise.resolve())
        .mockImplementationOnce(() => Promise.reject(error));
      const command = {
        type: InternalCommandType.STANDBY_NEXT,
        data: {
          zone_id,
        },
      };
      try {
        await internalExecutor(command, foundZone);
      } catch (e: unknown) {
        expect(e).toBe(error);
      }
      expect(control).toHaveBeenCalledTimes(3);
      expect(control).toHaveBeenNthCalledWith(1, zone, "pause");
      expect(control).toHaveBeenNthCalledWith(2, zone, "next");
      expect(control).toHaveBeenNthCalledWith(3, zone, "stop");
      expect(standby).not.toHaveBeenCalled();
    }
  );

  it("internalExecutor should only call skip QueueBot track and call RoonApiTransport#standby for StandbyNextCommand if given is not playing", async () => {
    const ignoredStates: RoonPlaybackState[] = ["paused", "loading", "stopped"];
    for (const state of ignoredStates) {
      try {
        zone.state = state;

        const command = {
          type: InternalCommandType.STANDBY_NEXT,
          data: {
            zone_id,
          },
        };
        await internalExecutor(command, foundZone);
        expect(control).toHaveBeenCalledTimes(2);
        expect(control).toHaveBeenNthCalledWith(1, zone, "next");
        expect(control).toHaveBeenNthCalledWith(2, zone, "stop");
        expect(standby).toHaveBeenNthCalledWith(1, output, { control_key: "1" });
        expect(standby).toHaveBeenNthCalledWith(2, output, { control_key: "2" });
        expect(standby).toHaveBeenNthCalledWith(3, other_output, { control_key: "1" });
      } finally {
        zone.state = "playing";
        control.mockClear();
        standby.mockClear();
      }
    }
  });

  it("internalExecutor should call RoonApiTransport#standby for every compatible outputs and return a fail promise if any call failed", async () => {
    const firstError = new Error("first error");
    const secondError = new Error("second error");
    standby
      .mockImplementationOnce(() => Promise.reject(firstError))
      .mockImplementationOnce(() => Promise.resolve())
      .mockImplementationOnce(() => Promise.reject(secondError));
    const command = {
      type: InternalCommandType.STANDBY_NEXT,
      data: {
        zone_id,
      },
    };
    try {
      await internalExecutor(command, foundZone);
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toEqual(firstError.message + "\n" + secondError.message);
    }
  });
});

const zone_id = "zone_id";
const output_id = "output_id";
const other_output_id = "other_output_id";
const yet_another_output_id = "yet_another_output_id";
const yet_again_another_output_id = "yet_again_another_output_id";

const output: Output = {
  output_id,
  source_controls: [
    {
      control_key: "1",
      supports_standby: true,
    },
    {
      control_key: "2",
      supports_standby: true,
    },
  ],
} as unknown as Output;

const other_output: Output = {
  output_id: other_output_id,
  source_controls: [
    {
      control_key: "1",
      supports_standby: true,
    },
  ],
} as unknown as Output;

const yet_another_output: Output = {
  output_id: yet_another_output_id,
  source_controls: [
    {
      control_key: "1",
      supports_standby: false,
    },
  ],
} as unknown as Output;

const yet_again_another_output: Output = {
  output_id: yet_again_another_output_id,
} as unknown as Output;

const zone = {
  zone_id,
  outputs: [output, other_output, yet_another_output, yet_again_another_output],
  state: "playing",
  is_next_allowed: true,
} as unknown as Zone;
