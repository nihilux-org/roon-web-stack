import { booleanAttribute, Directive, effect, ElementRef, inject, input, OnDestroy, Renderer2 } from "@angular/core";
import { ignoredClass } from "./ngx-spatial-navigable-utils";

@Directive({
  selector: "[ngxSnElement]",
})
export class NgxSpatialNavigableElementDirective implements OnDestroy {
  readonly ngxSnIgnore = input<boolean, string | boolean>(false, {
    transform: booleanAttribute,
  });

  private readonly _htmlElement: HTMLElement;
  private readonly _renderer: Renderer2;

  constructor() {
    this._htmlElement = inject(ElementRef).nativeElement as HTMLElement;
    this._renderer = inject(Renderer2);
    effect(() => {
      if (this.ngxSnIgnore()) {
        this._renderer.addClass(this._htmlElement, ignoredClass);
      } else {
        this._renderer.removeClass(this._htmlElement, ignoredClass);
      }
    });
  }

  ngOnDestroy() {
    this._renderer.removeClass(this._htmlElement, ignoredClass);
  }
}
