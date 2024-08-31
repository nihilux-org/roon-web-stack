import { MatDialogConfig } from "@angular/material/dialog";

export enum ChosenTheme {
  BROWSER = "BROWSER",
  DARK = "DARK",
  LIGHT = "LIGHT",
}

export type ClientBreakpoints = {
  [key: string]: boolean;
};

export enum DisplayMode {
  COMPACT = "COMPACT",
  ONE_COLUMN = "ONE_COLUMN",
  WIDE = "WIDE",
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
