import { Injectable, Signal, signal, WritableSignal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class IdleService {
  private static readonly IDLE_TIME = 5000;
  private readonly _$isIdle: WritableSignal<boolean>;
  private _idleTimeoutId?: ReturnType<typeof setTimeout>;
  constructor() {
    this._$isIdle = signal(false);
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

  private onUserInteraction() {
    this._$isIdle.set(false);
    this.refreshIdleTimeout();
  }

  private registerListeners() {
    window.addEventListener("mousemove", () => {
      this.onUserInteraction();
    });
    window.addEventListener("click", () => {
      this.onUserInteraction();
    });
    window.addEventListener("keypress", () => {
      this.onUserInteraction();
    });
    window.addEventListener("DOMMouseScroll", () => {
      this.onUserInteraction();
    });
    window.addEventListener("mousewheel", () => {
      this.onUserInteraction();
    });
    window.addEventListener("touchmove", () => {
      this.onUserInteraction();
    });
    window.addEventListener("MSPointerMove", () => {
      this.onUserInteraction();
    });
  }

  private unregisterListeners() {
    window.removeEventListener("mousemove", () => {
      this.onUserInteraction();
    });
    window.removeEventListener("click", () => {
      this.onUserInteraction();
    });
    window.removeEventListener("keypress", () => {
      this.onUserInteraction();
    });
    window.removeEventListener("DOMMouseScroll", () => {
      this.onUserInteraction();
    });
    window.removeEventListener("mousewheel", () => {
      this.onUserInteraction();
    });
    window.removeEventListener("touchmove", () => {
      this.onUserInteraction();
    });
    window.removeEventListener("MSPointerMove", () => {
      this.onUserInteraction();
    });
  }
}
