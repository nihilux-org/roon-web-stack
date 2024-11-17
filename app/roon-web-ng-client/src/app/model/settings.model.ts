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

export type ClientBreakpoints = {
  [key: string]: boolean;
};

export enum DisplayMode {
  COMPACT = "COMPACT",
  ONE_COLUMN = "ONE_COLUMN",
  WIDE = "WIDE",
  TEN_FEET = "TEN_FEET",
}

export const SettingsDialogConfig: MatDialogConfig = {
  restoreFocus: false,
  width: "500px",
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
  width: "800px",
};
