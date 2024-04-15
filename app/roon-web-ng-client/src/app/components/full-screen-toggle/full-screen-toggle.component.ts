import { ChangeDetectionStrategy, Component, Signal } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { FullscreenService } from "@services/fullscreen.service";

@Component({
  selector: "nr-full-screen-toggle",
  standalone: true,
  imports: [MatIcon, MatIconButton],
  templateUrl: "./full-screen-toggle.component.html",
  styleUrl: "./full-screen-toggle.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullScreenToggleComponent {
  private readonly _fullScreenService: FullscreenService;
  readonly supportsFullscreen: boolean;
  readonly $icon: Signal<string>;

  constructor(fullScreenService: FullscreenService) {
    this._fullScreenService = fullScreenService;
    this.supportsFullscreen = this._fullScreenService.supportsFullScreen();
    this.$icon = this._fullScreenService.icon();
  }

  toggleFullScreen() {
    this._fullScreenService.toggleFullScreen();
  }
}
