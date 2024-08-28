import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, OnDestroy, Signal, signal, WritableSignal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class FullscreenService implements OnDestroy {
  private static readonly ENTER_FULL_SCREEN_ICON = "open_in_full";
  private static readonly EXIT_FULL_SCREEN_ICON = "close_fullscreen";
  private readonly _$icon: WritableSignal<string>;

  constructor(@Inject(DOCUMENT) private readonly _document: Document) {
    if (this._document.fullscreenElement) {
      this._$icon = signal(FullscreenService.EXIT_FULL_SCREEN_ICON);
    } else {
      this._$icon = signal(FullscreenService.ENTER_FULL_SCREEN_ICON);
    }
    this._document.addEventListener("fullscreenchange", () => {
      this.onFullscreenChange();
    });
  }

  toggleFullScreen() {
    if (this.supportsFullScreen()) {
      if (this.isFullScreen()) {
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

  isFullScreen(): boolean {
    return this._document.fullscreenElement !== null;
  }

  supportsFullScreen() {
    return this._document.fullscreenEnabled;
  }

  icon(): Signal<string> {
    return this._$icon;
  }

  ngOnDestroy() {
    this._document.removeEventListener("fullscreenchange", () => {
      this.onFullscreenChange();
    });
  }

  private onFullscreenChange(): void {
    const isFullScreen =
      this._document.fullscreenElement != null
        ? FullscreenService.EXIT_FULL_SCREEN_ICON
        : FullscreenService.ENTER_FULL_SCREEN_ICON;
    if (isFullScreen !== this._$icon()) {
      this._$icon.set(isFullScreen);
    }
  }
}
