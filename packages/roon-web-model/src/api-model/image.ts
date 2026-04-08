import { RoonApiImageResultOptions } from "../roon-kit";

export interface Image {
  data: Uint8Array<ArrayBuffer>;
  contentType: string;
  cacheable: boolean;
}

export interface ImageFetcher {
  fetch: (image_key: string, options: RoonApiImageResultOptions) => Promise<Image>;
}

export class MissingImageError extends Error {
  private readonly _cacheable: boolean;

  constructor(message: string, cacheable: boolean) {
    super(message);
    this._cacheable = cacheable;
  }

  get cacheable() {
    return this._cacheable;
  }
}
