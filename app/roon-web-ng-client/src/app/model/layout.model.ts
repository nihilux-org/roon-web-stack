import { TemplateRef } from "@angular/core";

export enum DisplayMode {
  COMPACT = "COMPACT",
  ONE_COLUMN = "ONE_COLUMN",
  WIDE = "WIDE",
  TEN_FEET = "TEN_FEET",
}

export interface DisplayModeData {
  label?: string;
  class: string;
}

export const DisplayModesData: { [key in DisplayMode]: DisplayModeData } = {
  COMPACT: {
    label: "Compact",
    class: "compact",
  },
  ONE_COLUMN: {
    class: "one-column",
  },
  TEN_FEET: {
    label: "10 feet",
    class: "ten-feet",
  },
  WIDE: {
    label: "Wide",
    class: "wide",
  },
};

export interface LayoutContext {
  class: string;
}

export interface LayoutData {
  zoneActions: TemplateRef<LayoutContext>;
  zoneCommands: TemplateRef<LayoutContext>;
  zoneCurrentTrack: TemplateRef<LayoutContext>;
  zoneImage: TemplateRef<LayoutContext>;
  zoneProgression: TemplateRef<LayoutContext>;
  zoneQueue: TemplateRef<LayoutContext>;
  zoneVolume: TemplateRef<LayoutContext>;
  context: LayoutContext;
}
