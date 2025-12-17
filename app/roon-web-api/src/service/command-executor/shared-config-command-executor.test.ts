import { roonMock } from "../../infrastructure/roon-extension.mock";

import { CommandType, SharedConfigCommand, SharedConfigUpdate } from "@nihilux/roon-web-model";
import { executor } from "./shared-config-command-executor";

describe("shared-config-command-executor test suite", () => {
  it("executor should call roon#saveSharedConfig", async () => {
    const sharedConfigUpdate: SharedConfigUpdate = {
      customActions: [],
    };
    const command: SharedConfigCommand = {
      type: CommandType.SHARED_CONFIG,
      data: {
        sharedConfigUpdate,
      },
    };

    const result = executor(command, roonMock);

    await expect(result).resolves.toBeUndefined();
    expect(roonMock.updateSharedConfig).toHaveBeenCalledWith(sharedConfigUpdate);
  });
  it("executor should return a rejected Promise if any error occured during the call of roon#saveSharedConfig", async () => {
    const error = new Error("error");
    roonMock.updateSharedConfig.mockImplementation(() => {
      throw error;
    });
    const command: SharedConfigCommand = {
      type: CommandType.SHARED_CONFIG,
      data: {
        sharedConfigUpdate: {
          customActions: [],
        },
      },
    };

    const result = executor(command, roonMock);
    await expect(result).rejects.toBe(error);
    expect(roonMock.updateSharedConfig).toHaveBeenCalledWith(command.data.sharedConfigUpdate);
  });
});
