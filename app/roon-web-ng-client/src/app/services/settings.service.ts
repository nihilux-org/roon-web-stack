import { effect, Injectable, RendererFactory2, Signal, signal, WritableSignal } from "@angular/core";
import { CHOSEN_THEME } from "@model/client";

@Injectable({
  providedIn: "root",
})
export class SettingsService {
  private static readonly DISPLAYED_ZONE_ID_KEY = "nr.SELECTED_ZONE_ID";
  private static readonly CHOSEN_THEME_KEY = "nr.IS_DARK_THEME";
  private readonly _$displayedZoneId: WritableSignal<string>;
  private readonly _$chosenTheme: WritableSignal<string>;

  constructor(rendererFactory: RendererFactory2) {
    this._$displayedZoneId = signal(localStorage.getItem(SettingsService.DISPLAYED_ZONE_ID_KEY) ?? "");
    this._$chosenTheme = signal(localStorage.getItem(SettingsService.CHOSEN_THEME_KEY) ?? "BROWSER");
    const renderer = rendererFactory.createRenderer(null, null);
    effect(() => {
      let isDarkTheme: boolean;
      switch (this._$chosenTheme() as CHOSEN_THEME) {
        case CHOSEN_THEME.DARK:
          isDarkTheme = true;
          break;
        case CHOSEN_THEME.LIGHT:
          isDarkTheme = false;
          break;
        default:
          isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
          break;
      }
      if (isDarkTheme) {
        renderer.removeClass(window.document.body, "light-theme");
      } else {
        renderer.addClass(window.document.body, "light-theme");
      }
    });
  }

  saveDisplayedZoneId(zoneId: string) {
    localStorage.setItem(SettingsService.DISPLAYED_ZONE_ID_KEY, zoneId);
    this._$displayedZoneId.set(zoneId);
  }

  displayedZoneId(): Signal<string> {
    return this._$displayedZoneId;
  }

  saveChosenTheme(chosenTheme: CHOSEN_THEME) {
    localStorage.setItem(SettingsService.CHOSEN_THEME_KEY, chosenTheme);
    this._$chosenTheme.set(chosenTheme);
  }

  chosenTheme(): Signal<string> {
    return this._$chosenTheme;
  }
}
