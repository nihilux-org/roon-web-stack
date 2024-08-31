export enum VisibilityState {
  VISIBLE = "VISIBLE",
  HIDDEN = "HIDDEN",
}

export type VisibilityListener = (state: VisibilityState) => void;
