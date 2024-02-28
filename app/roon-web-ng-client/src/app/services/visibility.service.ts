import { fromEvent, map, mergeWith, Observable, Observer, Subscription } from "rxjs";
import { Injectable } from "@angular/core";
import { VisibilityState } from "@model/client";

@Injectable({
  providedIn: "root",
})
export class VisibilityService {
  private readonly _visibilityObservable$: Observable<VisibilityState>;

  constructor() {
    const documentVisibilityEvent$ = fromEvent(document, "visibilitychange").pipe(
      map(() => {
        if (document.visibilityState === "visible") {
          return VisibilityState.VISIBLE;
        } else {
          return VisibilityState.HIDDEN;
        }
      })
    );
    // needed for iPhone on iOS, because window$focus and visibilitychange are not consistently fired
    const windowPageShowEvent$ = fromEvent(window, "pageshow").pipe(map(() => VisibilityState.VISIBLE));
    // needed for iPad on iPadOS, because window$pageshow and visibilitychange are not consistently fired
    const windowFocus$ = fromEvent(window, "focus").pipe(map(() => VisibilityState.VISIBLE));
    // FIXME?: register events depending on user-agent?
    this._visibilityObservable$ = documentVisibilityEvent$.pipe(mergeWith(windowPageShowEvent$, windowFocus$));
  }

  // this is firing too much VISIBLE events, handle with care (and safe retry 🤷)
  observeVisibility(
    observerOrNext?: Partial<Observer<VisibilityState>> | ((value: VisibilityState) => void)
  ): Subscription {
    return this._visibilityObservable$.subscribe(observerOrNext);
  }
}
