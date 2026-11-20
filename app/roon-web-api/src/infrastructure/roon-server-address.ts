import process from "process";
import { RoonServerAddress } from "@nihilux/roon-web-model";

const DEFAULT_ROON_SERVER_PORT = 9330;

export const roonServerAddress: RoonServerAddress = (() => {
  const host = process.env.ROON_SERVER_IP;
  const port = parseInt(process.env.ROON_SERVER_PORT ?? "", 10);
  return {
    host: host !== "" ? host : undefined,
    port: Number.isNaN(port) ? DEFAULT_ROON_SERVER_PORT : port,
  };
})();
