import { TemplateRef } from "@angular/core";

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
