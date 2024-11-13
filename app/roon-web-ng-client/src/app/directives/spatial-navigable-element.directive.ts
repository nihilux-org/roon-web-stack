import {
  booleanAttribute,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  SimpleChanges,
} from "@angular/core";

@Directive({
  standalone: true,
  selector: "[nrSnElement]",
})
export class SpatialNavigableElementDirective implements OnDestroy, OnChanges {
  @Input({ required: false, transform: booleanAttribute }) nrSnIgnore: boolean = false;

  private readonly _htmlElement: HTMLElement;
  private readonly _renderer: Renderer2;

  constructor(el: ElementRef, renderer: Renderer2) {
    this._htmlElement = el.nativeElement as HTMLElement;
    this._renderer = renderer;
  }

  ngOnDestroy() {
    this._renderer.removeClass(this._htmlElement, "lrud-ignore");
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const changeKey in changes) {
      if (changeKey === "nrSnIgnore") {
        if (this.nrSnIgnore) {
          this._renderer.addClass(this._htmlElement, "lrud-ignore");
        } else {
          this._renderer.removeClass(this._htmlElement, "lrud-ignore");
        }
      }
    }
  }
}
