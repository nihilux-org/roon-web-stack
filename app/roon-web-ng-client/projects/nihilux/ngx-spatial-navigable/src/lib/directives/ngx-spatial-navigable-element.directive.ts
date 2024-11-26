import { booleanAttribute, Directive, effect, ElementRef, inject, input, OnDestroy, Renderer2 } from "@angular/core";
import { ignoredClass } from "../model";

@Directive({
  selector: "[ngxSnElement]",
})
export class NgxSpatialNavigableElementDirective implements OnDestroy {
  readonly ngxSnIgnore = input<boolean, string | boolean>(false, {
    transform: booleanAttribute,
  });
  readonly ngxSnFocusOnFirstInput = input<boolean, string | boolean>(false, {
    transform: booleanAttribute,
  });
  readonly ngxSnClickOnEnter = input<boolean, string | boolean>(false, {
    transform: booleanAttribute,
  });

  private readonly _htmlElement: HTMLElement;
  private readonly _renderer: Renderer2;
  private _htmlElementForFocus: HTMLElement;

  constructor() {
    this._htmlElement = inject(ElementRef).nativeElement as HTMLElement;
    this._htmlElementForFocus = this._htmlElement;
    this._renderer = inject(Renderer2);
    effect(() => {
      if (this.ngxSnFocusOnFirstInput()) {
        this._htmlElementForFocus = this._htmlElement.querySelector("input") ?? this._htmlElement;
        this._htmlElement.addEventListener("focus", () => {
          this.onFocus();
        });
      } else {
        this._htmlElementForFocus = this._htmlElement;
        this._htmlElement.removeEventListener("focus", () => {
          this.onFocus();
        });
      }
      if (this.ngxSnIgnore()) {
        this._renderer.addClass(this._htmlElementForFocus, ignoredClass);
        this._htmlElementForFocus.removeEventListener("keydown", (event: KeyboardEvent) => {
          this.onEnter(event);
        });
      } else {
        this._renderer.removeClass(this._htmlElementForFocus, ignoredClass);
        if (this.ngxSnClickOnEnter()) {
          this._htmlElementForFocus.addEventListener("keydown", (event: KeyboardEvent) => {
            this.onEnter(event);
          });
        }
      }
    });
  }

  ngOnDestroy() {
    this._renderer.removeClass(this._htmlElement, ignoredClass);
    this._htmlElementForFocus.removeEventListener("keydown", (event: KeyboardEvent) => {
      this.onEnter(event);
    });
  }

  private onEnter(event: KeyboardEvent) {
    if (event.key === "Enter") {
      this._htmlElementForFocus.click();
    }
  }

  private onFocus() {
    this._htmlElementForFocus.focus();
  }
}
