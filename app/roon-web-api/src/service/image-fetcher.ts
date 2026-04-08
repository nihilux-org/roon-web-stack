import { airplayManager } from "@data";
import { logger, roon } from "@infrastructure";
import { Image, ImageFetcher, MissingImageError, RoonApiImageResultOptions } from "@nihilux/roon-web-model";

const fetch = async (image_key: string, options: RoonApiImageResultOptions): Promise<Image> => {
  const isAirplayImage = airplayManager.isAirplayImageKey(image_key);
  if (isAirplayImage) {
    const airplayImage = airplayManager.image;
    if (airplayImage !== undefined) {
      return {
        ...airplayImage,
        cacheable: false,
      };
    } else {
      logger.debug(`no current airplay image for ${image_key}`);
      throw new MissingImageError("no airplay image", false);
    }
  } else {
    try {
      const { content_type, image } = await roon.getImage(image_key, options);
      return {
        data: image,
        contentType: content_type,
        cacheable: false,
      };
    } catch (err) {
      if (err === "NotFound") {
        throw new MissingImageError(`${image_key} not found`, true);
      }
      logger.error(err, "image can't be fetched from roon");
      throw err;
    }
  }
};

export const imageFetcher: ImageFetcher = {
  fetch,
};
