export interface AirplayManager {
  start: (streamUrl: string) => Promise<void>;
  stop: () => Promise<void>;
  isAirplayZone: (zone_id: string) => boolean;
  updateMetadata: (metadata: AirplayMetadata) => Promise<void>;
  image?: AirplayImage;
  isAirplayImageKey: (image_key: string) => boolean;
}

export interface AirplayMetadata {
  artist?: string;
  album?: string;
  title?: string;
}

export interface AirplayImage {
  data: Uint8Array<ArrayBuffer>;
  contentType: string;
  image_key?: string;
}
