import { DOCUMENT } from "@angular/common";
import { inject, Injectable, OnDestroy } from "@angular/core";
import { VisibilityListener, VisibilityState } from "@model";

interface VisibilityEvent {
  visibilityState: VisibilityState;
  time: number;
}

@Injectable({
  providedIn: "root",
})
export class VisibilityService implements OnDestroy {
  private readonly _document: Document;
  private readonly _eventsToListen = ["pageshow", "pagehide"];
  private readonly _visibilityListener: VisibilityListener[];
  private readonly _windowListener: () => void;
  private _lastEvent: VisibilityEvent;

  constructor() {
    this._document = inject<Document>(DOCUMENT);
    this._visibilityListener = [];
    this._windowListener = () => {
      const visibilityEvent = this.buildVisibilityEvent();
      if (
        this._visibilityListener.length > 0 &&
        (visibilityEvent.visibilityState !== this._lastEvent.visibilityState ||
          visibilityEvent.time - this._lastEvent.time > 250)
      ) {
        this._lastEvent = visibilityEvent;
        for (const listener of this._visibilityListener) {
          listener(visibilityEvent.visibilityState);
        }
      }
    };
    this._visibilityListener = [];
    this._lastEvent = this.buildVisibilityEvent();
  }

  listen(visibilityListener: VisibilityListener): void {
    const mustStartListening = this._visibilityListener.length === 0;
    this._visibilityListener.push(visibilityListener);
    if (mustStartListening) {
      if (this._document.defaultView) {
        for (const eventType of this._eventsToListen) {
          this._document.defaultView.addEventListener(eventType, this._windowListener);
        }
        this._document.addEventListener("visibilitychange", this._windowListener);
      }
    }
  }

  private buildVisibilityEvent(): VisibilityEvent {
    const time = Date.now();
    if (this._document.visibilityState === "visible") {
      return {
        visibilityState: VisibilityState.VISIBLE,
        time,
      };
    } else {
      return {
        visibilityState: VisibilityState.HIDDEN,
        time,
      };
    }
  }

  ngOnDestroy() {
    if (this._visibilityListener.length > 0) {
      for (const eventType of this._eventsToListen) {
        this._document.defaultView?.removeEventListener(eventType, this._windowListener);
      }
      this._document.removeEventListener("visibilitychange", this._windowListener);
    }
  }
}
