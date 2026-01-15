import { MatDialogConfig } from "@angular/material/dialog";

export enum ChosenTheme {
  BROWSER = "BROWSER",
  DARK = "DARK",
  LIGHT = "LIGHT",
}

export interface Theme {
  id: ChosenTheme;
  label: string;
  icon: string;
}

export const Themes: Theme[] = [
  {
    id: ChosenTheme.BROWSER,
    icon: "contrast",
    label: "Browser",
  },
  {
    id: ChosenTheme.LIGHT,
    icon: "light_mode",
    label: "Light",
  },
  {
    id: ChosenTheme.DARK,
    icon: "dark_mode",
    label: "Dark",
  },
];

export interface FullscreenToggle {
  value: boolean;
  label: string;
  style: {
    opacity: number;
  };
}

export const FullscreenToggles: FullscreenToggle[] = [
  {
    value: true,
    label: "Yes",
    style: {
      opacity: 1.0,
    },
  },
  {
    value: false,
    label: "No",
    style: {
      opacity: 0.3,
    },
  },
];

export type ClientBreakpoints = Record<string, boolean>;

export const SettingsDialogConfig: MatDialogConfig = {
  restoreFocus: false,
  width: "600px",
  maxWidth: "95svw",
  maxHeight: "95svh",
  data: {
    selectedTab: 0,
  },
  position: {
    top: "5svh",
  },
};

export const SettingsDialogConfigBigFonts: MatDialogConfig = {
  ...SettingsDialogConfig,
  width: "900px",
};
