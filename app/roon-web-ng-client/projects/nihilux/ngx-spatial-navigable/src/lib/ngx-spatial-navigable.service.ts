import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, OnDestroy } from "@angular/core";
import { getNextFocus } from "./ngx-spatial-navigable-next-focus-finder";

@Injectable({
  providedIn: "root",
})
export class NgxSpatialNavigableService implements OnDestroy {
  private readonly _document: Document;
  private _rootElement?: HTMLElement;
  private readonly _starter: HTMLElement[];
  private _dialogElement?: HTMLElement;
  private _focusedElement?: HTMLElement;
  private _isActive: boolean;

  constructor(@Inject(DOCUMENT) document: Document) {
    this._document = document;
    this._isActive = true;
    this._starter = [];
    this._document.addEventListener("keydown", (event: KeyboardEvent) => {
      this.handleKeyDown(event);
    });
  }

  ngOnDestroy(): void {
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
        this._focusedElement = this.getNextFocus(this._focusedElement ?? null, event, scope);
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

  dialogOpened(htmlElement: HTMLElement | undefined, autofocus: string | false) {
    this._dialogElement = htmlElement;
    delete this._focusedElement;
    if (autofocus) {
      this._focusedElement = this._document.querySelector(autofocus) ?? undefined;
    }
  }

  dialogClosed() {
    delete this._dialogElement;
  }

  resetSpatialNavigation() {
    delete this._focusedElement;
  }

  private getStarter(): HTMLElement | undefined {
    return this._starter.at(-1);
  }

  private getNextFocus(current: HTMLElement | null, event: KeyboardEvent, scope: HTMLElement): HTMLElement | undefined {
    let candidate = current;
    let disabled = false;
    do {
      candidate = getNextFocus(candidate, event, scope);
      disabled = candidate?.getAttribute("disabled") === "true";
    } while (disabled);
    return candidate ?? this.getStarter();
  }
}
