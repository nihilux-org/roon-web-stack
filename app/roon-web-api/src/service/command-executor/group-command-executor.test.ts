import { CommandType, GroupCommand, OutputDescription, RoonApiTransport, RoonServer } from "@model";
import { executor } from "./group-command-executor";

describe("group-command-executor.ts test suite", () => {
  let groupOutputsApi: jest.Mock;
  let ungroupOutputsApi: jest.Mock;
  let server: RoonServer;
  beforeEach(() => {
    groupOutputsApi = jest.fn().mockImplementation(() => Promise.resolve());
    ungroupOutputsApi = jest.fn().mockImplementation(() => Promise.resolve());
    const roonApiTransport: RoonApiTransport = {
      group_outputs: groupOutputsApi,
      ungroup_outputs: ungroupOutputsApi,
    } as unknown as RoonApiTransport;
    server = {
      services: {
        RoonApiTransport: roonApiTransport,
      },
    } as unknown as RoonServer;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("executor should call RoonApiTransport#group_outputs with given OutputDescription[] if command mode is 'group'", () => {
    const command: GroupCommand = {
      type: CommandType.GROUP,
      data: {
        outputs: OUTPUTS,
        mode: "group",
      },
    };
    const executorPromise = executor(command, server);
    void expect(executorPromise).resolves.toBeUndefined();
    expect(groupOutputsApi).toHaveBeenCalledTimes(1);
    expect(groupOutputsApi).toHaveBeenCalledWith(OUTPUTS);
  });

  it("executor should call RoonApiTransport#ungroup_outputs with given OutputDescription[] if command mode is 'ungroup'", () => {
    const command: GroupCommand = {
      type: CommandType.GROUP,
      data: {
        outputs: OUTPUTS,
        mode: "ungroup",
      },
    };
    const executorPromise = executor(command, server);
    void expect(executorPromise).resolves.toBeUndefined();
    expect(ungroupOutputsApi).toHaveBeenCalledTimes(1);
    expect(ungroupOutputsApi).toHaveBeenCalledWith(OUTPUTS);
  });

  it("executor should return a rejected Promise if any error occurred during RoonApiTransport#group_outputs call", () => {
    const error = new Error("error!");
    groupOutputsApi.mockImplementation(() => Promise.reject(error));
    const command: GroupCommand = {
      type: CommandType.GROUP,
      data: {
        outputs: OUTPUTS,
        mode: "group",
      },
    };
    const executorPromise = executor(command, server);
    void expect(executorPromise).rejects.toEqual(error);
    expect(groupOutputsApi).toHaveBeenCalledTimes(1);
    expect(groupOutputsApi).toHaveBeenCalledWith(OUTPUTS);
  });

  it("executor should return a rejected Promise if any error occurred during RoonApiTransport#ungroup_outputs call", () => {
    const error = new Error("error!");
    ungroupOutputsApi.mockImplementation(() => Promise.reject(error));
    const command: GroupCommand = {
      type: CommandType.GROUP,
      data: {
        outputs: OUTPUTS,
        mode: "ungroup",
      },
    };
    const executorPromise = executor(command, server);
    void expect(executorPromise).rejects.toEqual(error);
    expect(ungroupOutputsApi).toHaveBeenCalledTimes(1);
    expect(ungroupOutputsApi).toHaveBeenCalledWith(OUTPUTS);
  });
});

const OUTPUTS: OutputDescription[] = [
  {
    output_id: "output_id",
    display_name: "display_name",
    zone_id: "zone_id",
  },
  {
    output_id: "other_output_id",
    display_name: "other_display_name",
    zone_id: "other_zone_id",
  },
];
