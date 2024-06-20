import { roonMock } from "../../infrastructure/roon-extension.mock";

import { CommandType, RoonServer, SharedConfig, SharedConfigCommand } from "@model";
import { executor } from "./shared-config-command-executor";

describe("shared-config-command-executor test suite", () => {
  it("executor should call roon#saveSharedConfig", () => {
    const sharedConfig: SharedConfig = {
      customActions: [],
    };
    const command: SharedConfigCommand = {
      type: CommandType.SHARED_CONFIG,
      data: {
        sharedConfig,
      },
    };

    const result = executor(command, {} as unknown as RoonServer);

    void expect(result).resolves.toBeUndefined();
    expect(roonMock.saveSharedConfig).toHaveBeenCalledWith(sharedConfig);
  });
  it("executor should return a rejected Promise if any error occured during the call of roon#saveSharedConfig", () => {
    const error = new Error("error");
    roonMock.saveSharedConfig.mockImplementation(() => {
      throw error;
    });
    const command: SharedConfigCommand = {
      type: CommandType.SHARED_CONFIG,
      data: {
        sharedConfig: {
          customActions: [],
        },
      },
    };

    const result = executor(command, {} as unknown as RoonServer);
    void expect(result).rejects.toBe(error);
    expect(roonMock.saveSharedConfig).toHaveBeenCalledWith(command.data.sharedConfig);
  });
});
