export interface AirplayService {
  start: (streamUrl: string) => Promise<void>;
  stop: () => Promise<void>;
  updateMetadata: (metadata: AirplayMetadata) => Promise<void>;
}

export interface AirplayMetadata {
  artist?: string;
  album?: string;
  title?: string;
}
