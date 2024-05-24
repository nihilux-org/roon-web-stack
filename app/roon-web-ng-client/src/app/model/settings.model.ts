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

export enum VisibilityState {
  VISIBLE = "VISIBLE",
  HIDDEN = "HIDDEN",
}
