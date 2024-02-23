import { debounceTime, NextObserver, Observable, Subscriber, Subscription } from "rxjs";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ResizeService {
  private readonly _resizeObserver: ResizeObserver;
  private readonly _observers: Map<Element, NextObserver<ResizeObserverEntry>>;

  constructor() {
    this._observers = new Map<Element, NextObserver<ResizeObserverEntry>>();
    this._resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const resizeEntry of entries) {
        const observer = this._observers.get(resizeEntry.target);
        if (observer) {
          observer.next(resizeEntry);
        }
      }
    });
  }

  public observeElement: (el: Element) => Observable<ResizeObserverEntry> = (el) => {
    const previousSubscriber = this._observers.get(el);
    if (previousSubscriber?.complete) {
      previousSubscriber.complete();
    }
    this._resizeObserver.observe(el);
    const observable = new Observable<ResizeObserverEntry>((subscriber: Subscriber<ResizeObserverEntry>) => {
      this._observers.set(el, subscriber);
      return new Subscription(() => {
        this._resizeObserver.unobserve(el);
        this._observers.delete(el);
      });
    });
    return observable.pipe(debounceTime(10));
  };
}
