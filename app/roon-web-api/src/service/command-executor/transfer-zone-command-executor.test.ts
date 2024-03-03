import { CommandType, FoundZone, RoonApiTransport, RoonServer, TransferZoneCommand, Zone } from "@model";
import { executor } from "./transfer-zone-command-executor";

describe("transfer-zone-command-executor.ts test suite", () => {
  let transferZoneApi: jest.Mock;
  let zoneByZoneIdApi: jest.Mock;
  let server: RoonServer;
  let foundZone: FoundZone;
  beforeEach(() => {
    transferZoneApi = jest.fn().mockImplementation(() => Promise.resolve());
    zoneByZoneIdApi = jest.fn().mockImplementation((zid) => {
      if (zid === to_zone_id) {
        return to_zone;
      }
    });
    const roonApiTransport: RoonApiTransport = {
      transfer_zone: transferZoneApi,
      zone_by_zone_id: zoneByZoneIdApi,
    } as unknown as RoonApiTransport;
    server = {
      services: {
        RoonApiTransport: roonApiTransport,
      },
    } as unknown as RoonServer;
    foundZone = {
      zone,
      server,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("executor should find the destination zone object by calling RoonApiTransoprt#zone_by_zone_id and then return the Promise returned by RoonApiTransoprt#transfer_zone", () => {
    const command: TransferZoneCommand = {
      type: CommandType.TRANSFER_ZONE,
      data: {
        zone_id,
        to_zone_id,
      },
    };
    const executorPromise = executor(command, foundZone);
    void expect(executorPromise).resolves.toBeUndefined();
    expect(zoneByZoneIdApi).toHaveBeenCalledWith(to_zone_id);
    expect(transferZoneApi).toHaveBeenCalledWith(zone, to_zone);
  });

  it("executor should return a rejected Promise if the destination zone_id is not a valid zone_id without calling RoonApiTransoprt#transfer_zone", () => {
    zoneByZoneIdApi.mockImplementation(() => null);
    const command: TransferZoneCommand = {
      type: CommandType.TRANSFER_ZONE,
      data: {
        zone_id,
        to_zone_id,
      },
    };
    const executorPromise = executor(command, foundZone);
    void expect(executorPromise).rejects.toEqual(new Error(`'${to_zone_id}' is not a valid zone_id`));
    expect(zoneByZoneIdApi).toHaveBeenCalledWith(to_zone_id);
    expect(transferZoneApi).toHaveBeenCalledTimes(0);
  });

  it("executor should return a rejected Promise if RoonApiTransoprt#transfer_zone returns a rejected Promise", () => {
    const error = new Error("error!");
    transferZoneApi.mockImplementation(() => Promise.reject(error));
    const command: TransferZoneCommand = {
      type: CommandType.TRANSFER_ZONE,
      data: {
        zone_id,
        to_zone_id,
      },
    };
    const executorPromise = executor(command, foundZone);
    void expect(executorPromise).rejects.toEqual(error);
    expect(zoneByZoneIdApi).toHaveBeenCalledWith(to_zone_id);
    expect(transferZoneApi).toHaveBeenCalledWith(zone, to_zone);
  });
});

const zone_id = "zone_id";
const zone = {
  zone_id,
} as unknown as Zone;
const to_zone_id = "to_zone_id";
const to_zone = {
  zone_id: to_zone_id,
} as unknown as Zone;
