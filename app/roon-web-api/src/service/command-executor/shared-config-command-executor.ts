import { roon } from "@infrastructure";
import { CommandExecutor, RoonServer, SharedConfigCommand } from "@nihilux/roon-web-model";

export const executor: CommandExecutor<SharedConfigCommand, RoonServer> = (command) => {
  try {
    roon.updateSharedConfig(command.data.sharedConfigUpdate);
    return Promise.resolve();
  } catch (err: unknown) {
    return Promise.reject(err as Error);
  }
};
