import { DOCUMENT } from "@angular/common";
import { effect, EffectRef, Inject, Injectable, OnDestroy, Signal } from "@angular/core";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getNextFocus } from "@bbc/tv-lrud-spatial";
import { IdleService } from "@services/idle.service";

@Injectable({
  providedIn: "root",
})
export class SpatialNavigationService implements OnDestroy {
  private readonly _document: Document;
  private readonly _idleEffect: EffectRef;
  private readonly _isIdle: Signal<boolean>;
  private _rootElement?: HTMLElement;
  private readonly _starter: HTMLElement[];
  private _dialogElement?: HTMLElement;
  private _focusedElement?: HTMLElement;
  private _isActive: boolean;

  constructor(@Inject(DOCUMENT) document: Document, idleService: IdleService) {
    this._document = document;
    this._isActive = true;
    this._starter = [];
    this._document.addEventListener("keydown", (event: KeyboardEvent) => {
      this.handleKeyDown(event);
    });
    this._isIdle = idleService.isIdle();
    this._idleEffect = effect(() => {
      if (this._isIdle()) {
        delete this._focusedElement;
      }
    });
  }

  ngOnDestroy(): void {
    this._idleEffect.destroy();
    this._document.removeEventListener("keydown", (event: KeyboardEvent) => {
      this.handleKeyDown(event);
    });
  }

  registerRoot(htmlElement: HTMLElement): void {
    this._rootElement = htmlElement;
  }

  registerStarter(htmlElement: HTMLElement): void {
    this._starter.push(htmlElement);
  }

  unregisterStarter(htmlElement: HTMLElement): void {
    const elementIndex = this._starter.findIndex((el: HTMLElement) => el === htmlElement);
    if (elementIndex >= 0) {
      this._starter.splice(elementIndex, 1);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this._isActive) {
      return;
    }
    const element = event.target as HTMLElement;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      if (
        ["ArrowLeft", "ArrowRight"].includes(event.key) &&
        ["text", "password", "email", "number", "search", "tel", "url"].includes(element.getAttribute("type") ?? "")
      ) {
        return;
      }
      const scope = this._dialogElement ?? this._rootElement;
      if (!scope) {
        return;
      }
      event.preventDefault();
      if (this._focusedElement || this._dialogElement) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        this._focusedElement = getNextFocus(event.target, event.key, scope) ?? this.getStarter();
        if (this._focusedElement?.getAttribute("disabled") === "true") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
          this._focusedElement = getNextFocus(this._focusedElement, event.key, scope) ?? this.getStarter();
        }
      } else {
        this._focusedElement = this.getStarter();
      }
      this._focusedElement?.focus();
    }
  }

  suspendSpatialNavigation() {
    this._isActive = false;
  }

  resumeSpatialNavigation() {
    this._isActive = true;
  }

  dialogOpened(htmlElement?: HTMLElement) {
    this._dialogElement = htmlElement;
    delete this._focusedElement;
  }

  dialogClosed() {
    delete this._dialogElement;
  }

  private getStarter(): HTMLElement | undefined {
    return this._starter.at(-1);
  }
}
