import { DOCUMENT } from "@angular/common";
import { ChangeDetectionStrategy, Component, Inject, OnInit, signal, WritableSignal } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: "nr-full-screen-toggle",
  standalone: true,
  imports: [MatIcon, MatIconButton],
  templateUrl: "./full-screen-toggle.component.html",
  styleUrl: "./full-screen-toggle.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullScreenToggleComponent implements OnInit {
  private static FULL_SCREEN_ICON = "open_in_full";
  private static EXIT_FULL_SCREEN_ICON = "close_fullscreen";
  readonly $icon: WritableSignal<string>;

  constructor(@Inject(DOCUMENT) private readonly _document: Document) {
    this.$icon = signal(FullScreenToggleComponent.FULL_SCREEN_ICON);
  }

  ngOnInit(): void {
    if (this._document.fullscreenElement) {
      this.$icon.set(FullScreenToggleComponent.EXIT_FULL_SCREEN_ICON);
    }
  }

  toggleFullScreen() {
    if (this._document.fullscreenElement) {
      void this._document.exitFullscreen().then(() => {
        this.$icon.set(FullScreenToggleComponent.FULL_SCREEN_ICON);
      });
    } else {
      void this._document.documentElement
        .requestFullscreen({
          navigationUI: "hide",
        })
        .then(() => {
          this.$icon.set(FullScreenToggleComponent.EXIT_FULL_SCREEN_ICON);
        });
    }
  }
}
