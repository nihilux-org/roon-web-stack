import * as os from "node:os";
import process from "process";
import { HostInfo } from "@nihilux/roon-web-model";

export const hostInfo: HostInfo = (() => {
  const { HOST = "localhost", PORT = "3000" } = process.env;
  const host = HOST;
  const port = parseInt(PORT, 10);
  const hostname = os.hostname();
  if (host !== "localhost") {
    let ipV4: string | undefined;
    const ifaces = os.networkInterfaces();
    for (const ifaceName in ifaces) {
      const iface = ifaces[ifaceName];
      if (iface) {
        for (const addr of iface) {
          if (
            addr.family === "IPv4" &&
            !addr.internal &&
            // exclude docker default bridge
            !addr.mac.startsWith("02:42") &&
            // exclude obviously VPN adresses
            addr.mac !== "00:00:00:00:00:00"
          ) {
            ipV4 = addr.address;
            break;
          }
        }
      }
    }
    ipV4 = ipV4 ?? host;
    return { host, port, ipV4, hostname };
  } else {
    return { host, port, hostname, ipV4: host };
  }
})();
