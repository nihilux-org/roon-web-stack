import { roonMock } from "../../infrastructure/roon-extension.mock";

import { CommandType, RoonServer, SharedConfigCommand, SharedConfigUpdate } from "@model";
import { executor } from "./shared-config-command-executor";

describe("shared-config-command-executor test suite", () => {
  it("executor should call roon#saveSharedConfig", () => {
    const sharedConfigUpdate: SharedConfigUpdate = {
      customActions: [],
    };
    const command: SharedConfigCommand = {
      type: CommandType.SHARED_CONFIG,
      data: {
        sharedConfigUpdate,
      },
    };

    const result = executor(command, {} as unknown as RoonServer);

    void expect(result).resolves.toBeUndefined();
    expect(roonMock.updateSharedConfig).toHaveBeenCalledWith(sharedConfigUpdate);
  });
  it("executor should return a rejected Promise if any error occured during the call of roon#saveSharedConfig", () => {
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

    const result = executor(command, {} as unknown as RoonServer);
    void expect(result).rejects.toBe(error);
    expect(roonMock.updateSharedConfig).toHaveBeenCalledWith(command.data.sharedConfigUpdate);
  });
});
