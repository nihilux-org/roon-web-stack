import {
  CommandType,
  FoundZone,
  PlayFromHereCommand,
  RoonApiTransport,
  RoonApiTransportQueue,
  RoonServer,
  Zone,
} from "@model";
import { executor } from "./play-from-here-command-executor";

describe("play-command-executor test suite", () => {
  let playFromHereApi: jest.Mock;
  let server: RoonServer;
  let foundZone: FoundZone;
  beforeEach(() => {
    playFromHereApi = jest.fn().mockImplementation(() => Promise.resolve({} as unknown as RoonApiTransportQueue));
    const roonApiTransport: RoonApiTransport = {
      play_from_here: playFromHereApi,
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

  it("executor should call RoonApiTransoprt#play_from_here with expected parameters, the returned Promise should be voided", () => {
    const command: PlayFromHereCommand = {
      type: CommandType.PLAY_FROM_HERE,
      data: {
        zone_id,
        queue_item_id,
      },
    };
    const executorPromise = executor(command, foundZone);
    void expect(executorPromise).resolves.toBeUndefined();
    expect(playFromHereApi).toHaveBeenCalledWith(zone, queue_item_id);
  });

  it("executor should return a rejected Promise wrapping any error returned by RoonApiTransoprt#play_from_here", () => {
    const error = new Error("error");
    playFromHereApi.mockImplementation(() => Promise.reject(error));
    const command: PlayFromHereCommand = {
      type: CommandType.PLAY_FROM_HERE,
      data: {
        zone_id,
        queue_item_id,
      },
    };
    const executorPromise = executor(command, foundZone);
    void expect(executorPromise).rejects.toBe(error);
    expect(playFromHereApi).toHaveBeenCalledWith(zone, queue_item_id);
  });
});

const queue_item_id = "queue_item_id";
const zone_id = "zone_id";
const zone = {
  zone_id,
} as unknown as Zone;
