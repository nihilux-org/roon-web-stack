import { deepEqual } from "fast-equals";
import { Subscription } from "rxjs";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import {
  computed,
  effect,
  EffectRef,
  Injectable,
  OnDestroy,
  RendererFactory2,
  Signal,
  signal,
  WritableSignal,
} from "@angular/core";
import {
  Action,
  BrowseAction,
  ChosenTheme,
  ClientBreakpoints,
  CustomAction,
  DefaultActions,
  DisplayMode,
  LibraryAction,
  RadiosAction,
  ToggleQueueAction,
} from "@model/client";
import { CustomActionsService } from "@services/custom-actions.service";

@Injectable({
  providedIn: "root",
})
export class SettingsService implements OnDestroy {
  private static readonly SMALL_TABLET_LANDSCAPE =
    "(max-width: 1000px) and (max-height: 800px) and (orientation: landscape)";
  private static readonly WATCH_BREAKPOINTS = [
    Breakpoints.XSmall,
    Breakpoints.Handset,
    Breakpoints.TabletPortrait,
    Breakpoints.HandsetPortrait,
    Breakpoints.HandsetPortrait,
    Breakpoints.WebPortrait,
    SettingsService.SMALL_TABLET_LANDSCAPE,
  ];
  private static readonly DISPLAYED_ZONE_ID_KEY = "nr.SELECTED_ZONE_ID";
  private static readonly CHOSEN_THEME_KEY = "nr.IS_DARK_THEME";
  private static readonly DISPLAY_QUEUE_TRACK_KEY = "nr.DISPLAY_QUEUE_TRACK";
  private static readonly DISPLAY_MODE_KEY = "nr.DISPLAY_MODE";
  private static readonly ACTIONS_KEY = "nr.ACTIONS";
  private static readonly DISPLAY_MODE_CLASSES = ["one-column", "compact", "wide"];
  private readonly _breakpointObserver: BreakpointObserver;
  private readonly _customActionsService: CustomActionsService;
  private readonly _$actions: WritableSignal<Action[]>;
  private readonly _$allActions: Signal<Action[]>;
  private readonly _$availableActions: Signal<Action[]>;
  private readonly _$breakpoints: WritableSignal<ClientBreakpoints>;
  private readonly _$chosenTheme: WritableSignal<string>;
  private readonly _$customActions: Signal<CustomAction[]>;
  private readonly _$displayedZoneId: WritableSignal<string>;
  private readonly _$displayQueueTrack: WritableSignal<boolean>;
  private readonly _$displayMode: WritableSignal<DisplayMode>;
  private readonly _$displayModeClass: Signal<string>;
  private readonly _$isOneColumn: Signal<boolean>;
  private readonly _$isSmallScreen: Signal<boolean>;
  private readonly _$isSmallTablet: Signal<boolean>;
  private readonly _themeEffect: EffectRef;
  private readonly _reloadActionsEffect: EffectRef;
  private _breakPointSubscription?: Subscription;

  constructor(
    rendererFactory: RendererFactory2,
    breakPointObserver: BreakpointObserver,
    customActionsService: CustomActionsService
  ) {
    this._breakpointObserver = breakPointObserver;
    this._customActionsService = customActionsService;
    this._$displayedZoneId = signal(localStorage.getItem(SettingsService.DISPLAYED_ZONE_ID_KEY) ?? "", {
      equal: deepEqual,
    });
    this._$chosenTheme = signal(localStorage.getItem(SettingsService.CHOSEN_THEME_KEY) ?? "BROWSER");
    this._$displayQueueTrack = signal(this.loadBooleanFromLocalStorage(SettingsService.DISPLAY_QUEUE_TRACK_KEY, true));
    this._$breakpoints = signal(this.computeInitialBreakpoints(), {
      equal: deepEqual,
    });
    this._$customActions = this._customActionsService.customActions();
    this._$displayMode = signal(this.loadDisplayModeFromLocalStorage(DisplayMode.WIDE));
    this._$displayModeClass = computed(() => {
      let displayModeClass = "";
      if (this._$isOneColumn()) {
        displayModeClass = SettingsService.DISPLAY_MODE_CLASSES[0];
      } else {
        switch (this._$displayMode()) {
          case DisplayMode.COMPACT:
            displayModeClass = SettingsService.DISPLAY_MODE_CLASSES[1];
            break;
          case DisplayMode.WIDE:
            displayModeClass = SettingsService.DISPLAY_MODE_CLASSES[2];
            break;
        }
      }
      return displayModeClass;
    });
    this._$allActions = computed(() => {
      const customActions = this._$customActions();
      return [...DefaultActions, ...customActions];
    });
    this._$actions = signal(this.loadActionsFromLocalStorage());
    this._reloadActionsEffect = effect(
      () => {
        this._$customActions();
        this._$actions.set(this.loadActionsFromLocalStorage());
      },
      {
        allowSignalWrites: true,
      }
    );
    this._$availableActions = computed(() => {
      const allActions = this._$allActions();
      const actions = this._$actions();
      return allActions.filter((a) => !actions.includes(a));
    });
    this._$isOneColumn = computed(
      () => {
        const breakpoints = this._$breakpoints();
        let isOneColumn = false;
        for (const breakpoint of SettingsService.WATCH_BREAKPOINTS) {
          if (breakpoint !== SettingsService.SMALL_TABLET_LANDSCAPE && breakpoints[breakpoint]) {
            isOneColumn = true;
            break;
          }
        }
        return isOneColumn;
      },
      {
        equal: deepEqual,
      }
    );
    this._$isSmallScreen = computed(
      () => {
        const breakpoints = this._$breakpoints();
        let isSmallScreen = false;
        for (const breakpoint of SettingsService.WATCH_BREAKPOINTS) {
          if (
            breakpoint !== Breakpoints.WebPortrait &&
            breakpoint !== Breakpoints.TabletPortrait &&
            breakpoint !== SettingsService.SMALL_TABLET_LANDSCAPE &&
            breakpoints[breakpoint]
          ) {
            isSmallScreen = true;
            break;
          }
        }
        return isSmallScreen;
      },
      {
        equal: deepEqual,
      }
    );
    this._$isSmallTablet = computed(
      () => {
        const breakpoints = this._$breakpoints();
        return breakpoints[SettingsService.SMALL_TABLET_LANDSCAPE];
      },
      {
        equal: deepEqual,
      }
    );
    const renderer = rendererFactory.createRenderer(null, null);
    // FIXME?: should this be more semantically placed in nr-root.component?
    this._themeEffect = effect(() => {
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
    return this._$isOneColumn;
  }

  isSmallScreen(): Signal<boolean> {
    return this._$isSmallScreen;
  }

  isSmallTablet(): Signal<boolean> {
    return this._$isSmallTablet;
  }

  saveDisplayMode(displayMode: DisplayMode) {
    localStorage.setItem(SettingsService.DISPLAY_MODE_KEY, displayMode);
    this._$displayMode.set(displayMode);
  }

  displayMode(): Signal<DisplayMode> {
    return this._$displayMode;
  }

  displayModeClass(): Signal<string> {
    return this._$displayModeClass;
  }

  displayModeClasses(): string[] {
    return SettingsService.DISPLAY_MODE_CLASSES;
  }

  saveActions(actions: Action[]) {
    localStorage.setItem(
      SettingsService.ACTIONS_KEY,
      actions.map((a) => a.id).reduce((ids, id) => `${ids};${id}`)
    );
    this._$actions.set([...actions]);
  }

  actions(): Signal<Action[]> {
    return this._$actions;
  }

  availableActions(): Signal<Action[]> {
    return this._$availableActions;
  }

  ngOnDestroy() {
    this._breakPointSubscription?.unsubscribe();
    this._themeEffect.destroy();
    this._reloadActionsEffect.destroy();
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

  private loadActionsFromLocalStorage() {
    const storedValue = localStorage.getItem(SettingsService.ACTIONS_KEY);
    if (storedValue !== null) {
      const ids: string[] = storedValue.split(";");
      const actions = [];
      for (const id of ids) {
        const action = this._$allActions().find((a) => a.id === id);
        if (action) {
          actions.push(action);
        }
      }
      return actions;
    } else {
      return [ToggleQueueAction, BrowseAction, LibraryAction, RadiosAction];
    }
  }

  private loadDisplayModeFromLocalStorage(defaultValue: DisplayMode) {
    const displayMode = localStorage.getItem(SettingsService.DISPLAY_MODE_KEY);
    if (displayMode !== null) {
      if (Object.values(DisplayMode).includes(displayMode as DisplayMode)) {
        return displayMode as DisplayMode;
      }
    }
    return defaultValue;
  }
}
