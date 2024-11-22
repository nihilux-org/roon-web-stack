import {
  booleanAttribute,
  Directive,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  SimpleChanges,
} from "@angular/core";
import { ignoredClass } from "./ngx-spatial-navigable-next-focus-finder";

@Directive({
  selector: "[ngxSnElement]",
})
export class NgxSpatialNavigableElementDirective implements OnDestroy, OnChanges {
  @Input({ required: false, transform: booleanAttribute }) ngxSnIgnore: boolean = false;

  private readonly _htmlElement: HTMLElement;
  private readonly _renderer: Renderer2;

  constructor() {
    this._htmlElement = inject(ElementRef).nativeElement as HTMLElement;
    this._renderer = inject(Renderer2);
  }

  ngOnDestroy() {
    this._renderer.removeClass(this._htmlElement, ignoredClass);
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const changeKey in changes) {
      if (changeKey === "ngxSnIgnore") {
        if (this.ngxSnIgnore) {
          this._renderer.addClass(this._htmlElement, ignoredClass);
        } else {
          this._renderer.removeClass(this._htmlElement, ignoredClass);
        }
      }
    }
  }
}
