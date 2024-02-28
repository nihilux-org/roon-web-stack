import { Subscription } from "rxjs";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import {
  computed,
  effect,
  Injectable,
  OnDestroy,
  RendererFactory2,
  Signal,
  signal,
  WritableSignal,
} from "@angular/core";
import { ChosenTheme, ClientBreakpoints, DisplayMode } from "@model/client";

@Injectable({
  providedIn: "root",
})
export class SettingsService implements OnDestroy {
  private static readonly WATCH_BREAKPOINTS = [
    Breakpoints.XSmall,
    Breakpoints.Handset,
    Breakpoints.TabletPortrait,
    Breakpoints.HandsetPortrait,
    Breakpoints.WebPortrait,
  ];
  private static readonly DISPLAYED_ZONE_ID_KEY = "nr.SELECTED_ZONE_ID";
  private static readonly CHOSEN_THEME_KEY = "nr.IS_DARK_THEME";
  private static readonly DISPLAY_QUEUE_TRACK_KEY = "nr.DISPLAY_QUEUE_TRACK";
  private static readonly DISPLAY_MODE_KEY = "nr.DISPLAY_MODE";
  private readonly _breakpointObserver: BreakpointObserver;
  private readonly _$displayedZoneId: WritableSignal<string>;
  private readonly _$chosenTheme: WritableSignal<string>;
  private readonly _$displayQueueTrack: WritableSignal<boolean>;
  private readonly _$breakpoints: WritableSignal<ClientBreakpoints>;
  private readonly _$displayMode: WritableSignal<DisplayMode>;
  private _breakPointSubscription?: Subscription;

  constructor(rendererFactory: RendererFactory2, breakPointObserver: BreakpointObserver) {
    this._breakpointObserver = breakPointObserver;
    this._$displayedZoneId = signal(localStorage.getItem(SettingsService.DISPLAYED_ZONE_ID_KEY) ?? "");
    this._$chosenTheme = signal(localStorage.getItem(SettingsService.CHOSEN_THEME_KEY) ?? "BROWSER");
    this._$displayQueueTrack = signal(this.loadBooleanFromLocalStorage(SettingsService.DISPLAY_QUEUE_TRACK_KEY, true));
    this._$breakpoints = signal(this.computeInitialBreakpoints());
    this._$displayMode = signal((localStorage.getItem(SettingsService.DISPLAY_MODE_KEY) ?? "WIDE") as DisplayMode);
    const renderer = rendererFactory.createRenderer(null, null);
    // FIXME?: should this be more semantically placed in nr-root.component?
    effect(() => {
      let isDarkTheme: boolean;
      switch (this._$chosenTheme() as ChosenTheme) {
        case ChosenTheme.DARK:
          isDarkTheme = true;
          break;
        case ChosenTheme.LIGHT:
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
    this._breakPointSubscription = this._breakpointObserver
      .observe(SettingsService.WATCH_BREAKPOINTS)
      .subscribe((matcher) => {
        this._$breakpoints.set(matcher.breakpoints);
      });
  }

  saveDisplayedZoneId(zoneId: string) {
    localStorage.setItem(SettingsService.DISPLAYED_ZONE_ID_KEY, zoneId);
    this._$displayedZoneId.set(zoneId);
  }

  displayedZoneId(): Signal<string> {
    return this._$displayedZoneId;
  }

  saveChosenTheme(chosenTheme: ChosenTheme) {
    localStorage.setItem(SettingsService.CHOSEN_THEME_KEY, chosenTheme);
    this._$chosenTheme.set(chosenTheme);
  }

  chosenTheme(): Signal<string> {
    return this._$chosenTheme;
  }

  displayQueueTrack(): Signal<boolean> {
    return this._$displayQueueTrack;
  }

  saveDisplayQueueTrack(displayQueueTrack: boolean) {
    localStorage.setItem(SettingsService.DISPLAY_QUEUE_TRACK_KEY, `${displayQueueTrack}`);
    this._$displayQueueTrack.set(displayQueueTrack);
  }

  toggleDisplayQueueTrack() {
    this.saveDisplayQueueTrack(!this._$displayQueueTrack());
  }

  isOneColumn(): Signal<boolean> {
    return computed(() => {
      const breakpoints = this._$breakpoints();
      let isOneColumn = false;
      for (const breakpoint of SettingsService.WATCH_BREAKPOINTS) {
        if (breakpoint !== Breakpoints.WebPortrait && breakpoints[breakpoint]) {
          isOneColumn = true;
          break;
        }
      }
      return isOneColumn;
    });
  }

  isSmallScreen(): Signal<boolean> {
    return computed(() => {
      const breakpoints = this._$breakpoints();
      let isSmallScreen = false;
      for (const breakpoint of SettingsService.WATCH_BREAKPOINTS) {
        if (
          breakpoint !== Breakpoints.WebPortrait &&
          breakpoint !== Breakpoints.TabletPortrait &&
          breakpoints[breakpoint]
        ) {
          isSmallScreen = true;
          break;
        }
      }
      return isSmallScreen;
    });
  }

  saveDisplayMode(displayMode: DisplayMode) {
    localStorage.setItem(SettingsService.DISPLAY_MODE_KEY, displayMode);
    this._$displayMode.set(displayMode);
  }

  displayMode(): Signal<DisplayMode> {
    return this._$displayMode;
  }

  ngOnDestroy() {
    this._breakPointSubscription?.unsubscribe();
  }

  private loadBooleanFromLocalStorage(key: string, defaultValue: boolean) {
    const storedValue = localStorage.getItem(key);
    if (storedValue !== null) {
      return storedValue === "true";
    } else {
      return defaultValue;
    }
  }

  private computeInitialBreakpoints(): ClientBreakpoints {
    const breakpoints: ClientBreakpoints = {};
    for (const breakpoint of SettingsService.WATCH_BREAKPOINTS) {
      breakpoints[breakpoint] = this._breakpointObserver.isMatched(breakpoint);
    }
    return breakpoints;
  }
}
