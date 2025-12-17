import { CommandExecutor, Roon, SharedConfigCommand } from "@nihilux/roon-web-model";

export const executor: CommandExecutor<SharedConfigCommand, Roon> = (command, roon) => {
  try {
    roon.updateSharedConfig(command.data.sharedConfigUpdate);
    return Promise.resolve();
  } catch (err: unknown) {
    return Promise.reject(err as Error);
  }
};
