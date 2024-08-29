import { Observable } from "rxjs";
import {
  RoonApiBrowseLoadOptions,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseOptions,
  RoonApiBrowseResponse,
} from "../roon-kit";
import { Command, RoonSseMessage } from "./index";

export interface Client {
  events: () => Observable<RoonSseMessage>;
  close: () => void;
  command: (command: Command) => string;
  browse: (options: RoonApiBrowseOptions) => Promise<RoonApiBrowseResponse>;
  load: (options: RoonApiBrowseLoadOptions) => Promise<RoonApiBrowseLoadResponse>;
}

export interface ClientManager {
  register: (previous_client_id?: string) => string;
  unregister: (client_id: string) => void;
  get: (client_id: string) => Client;
  start: () => Promise<void>;
  stop: () => void;
}
