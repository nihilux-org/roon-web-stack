import { roon } from "@infrastructure";
import { CommandExecutor, RoonServer, SharedConfigCommand } from "@model";

export const executor: CommandExecutor<SharedConfigCommand, RoonServer> = (command) => {
  try {
    roon.saveSharedConfig(command.data.sharedConfig);
    return Promise.resolve();
  } catch (err: unknown) {
    return Promise.reject(err as Error);
  }
};
