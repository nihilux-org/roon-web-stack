import { Injectable, OnDestroy, Signal, signal, WritableSignal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class IdleService implements OnDestroy {
  private static readonly IDLE_TIME = 7000;
  private readonly _onUserInteraction: () => void;
  private readonly _$isIdle: WritableSignal<boolean>;
  private _idleTimeoutId?: ReturnType<typeof setTimeout>;
  constructor() {
    this._$isIdle = signal(false);
    this._onUserInteraction = () => {
      this._$isIdle.set(false);
      this.refreshIdleTimeout();
    };
  }

  isIdle(): Signal<boolean> {
    return this._$isIdle;
  }

  startWatch() {
    this.registerListeners();
    this.refreshIdleTimeout();
  }

  stopWatch() {
    this.stopIdleTimeout();
    this.unregisterListeners();
    this._$isIdle.set(false);
  }

  isWatching() {
    return this._idleTimeoutId != null;
  }

  private refreshIdleTimeout() {
    this.stopIdleTimeout();
    this._idleTimeoutId = setTimeout(() => {
      this._$isIdle.set(true);
    }, IdleService.IDLE_TIME);
  }

  private stopIdleTimeout() {
    if (this._idleTimeoutId !== undefined) {
      clearTimeout(this._idleTimeoutId);
    }
  }

  private registerListeners() {
    window.addEventListener("mousemove", this._onUserInteraction);
    window.addEventListener("click", this._onUserInteraction);
    window.addEventListener("keydown", this._onUserInteraction);
    window.addEventListener("DOMMouseScroll", this._onUserInteraction);
    window.addEventListener("mousewheel", this._onUserInteraction);
    window.addEventListener("touchmove", this._onUserInteraction);
  }

  private unregisterListeners() {
    window.removeEventListener("mousemove", this._onUserInteraction);
    window.removeEventListener("click", this._onUserInteraction);
    window.removeEventListener("keydown", this._onUserInteraction);
    window.removeEventListener("DOMMouseScroll", this._onUserInteraction);
    window.removeEventListener("mousewheel", this._onUserInteraction);
    window.removeEventListener("touchmove", this._onUserInteraction);
  }

  ngOnDestroy() {
    this.stopWatch();
  }
}
