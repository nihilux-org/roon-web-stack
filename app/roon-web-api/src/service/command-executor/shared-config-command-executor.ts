import { CommandExecutor, Roon, SharedConfigCommand } from "@nihilux/roon-web-model";

export const executor: CommandExecutor<SharedConfigCommand, Roon> = (command, roon) => {
  try {
    roon.updateSharedConfig(command.data.sharedConfigUpdate);
    return Promise.resolve();
  } catch (err: unknown) {
    const rejection = err instanceof Error ? err : new Error("unknown error during config update");
    return Promise.reject(rejection);
  }
};
