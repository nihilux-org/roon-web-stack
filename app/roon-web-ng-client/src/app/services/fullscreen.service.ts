import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class FullscreenService {
  private static readonly ENTER_FULL_SCREEN_ICON = "open_in_full";
  private static readonly EXIT_FULL_SCREEN_ICON = "close_fullscreen";
  private readonly _$icon: WritableSignal<string>;

  constructor(@Inject(DOCUMENT) private readonly _document: Document) {
    if (this._document.fullscreenElement) {
      this._$icon = signal(FullscreenService.EXIT_FULL_SCREEN_ICON);
    } else {
      this._$icon = signal(FullscreenService.ENTER_FULL_SCREEN_ICON);
    }
  }

  toggleFullScreen() {
    if (this.supportsFullScreen()) {
      if (this._document.fullscreenElement) {
        void this._document.exitFullscreen().then(() => {
          this._$icon.set(FullscreenService.ENTER_FULL_SCREEN_ICON);
        });
      } else {
        void this._document.documentElement
          .requestFullscreen({
            navigationUI: "hide",
          })
          .then(() => {
            this._$icon.set(FullscreenService.EXIT_FULL_SCREEN_ICON);
          });
      }
    }
  }

  supportsFullScreen() {
    return this._document.fullscreenEnabled;
  }

  icon(): Signal<string> {
    return this._$icon;
  }
}
