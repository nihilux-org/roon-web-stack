import { booleanAttribute, Directive, effect, ElementRef, inject, input, OnDestroy } from "@angular/core";
import { NgxSpatialNavigableService } from "@nihilux/ngx-spatial-navigable";

@Directive({
  selector: "[ngxSnStarter]",
})
export class NgxSpatialNavigableStarterDirective implements OnDestroy {
  readonly ngxSnStarterIgnore = input<boolean, string | boolean>(false, {
    transform: booleanAttribute,
  });
  readonly ngxSnStarterFocusOnFirstInput = input<boolean, string | boolean>(false, {
    transform: booleanAttribute,
  });
  private readonly _htmlElement: HTMLElement;
  private readonly _spatialNavigableService: NgxSpatialNavigableService;
  private _htmlElementForFocus: HTMLElement;

  constructor() {
    this._htmlElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    this._htmlElementForFocus = this._htmlElement;
    this._spatialNavigableService = inject(NgxSpatialNavigableService);
    effect(() => {
      if (this.ngxSnStarterFocusOnFirstInput()) {
        this._htmlElementForFocus = this._htmlElement.querySelector("input") ?? this._htmlElement;
      } else {
        this._htmlElementForFocus = this._htmlElement;
      }
      if (this.ngxSnStarterIgnore()) {
        this._spatialNavigableService.unregisterStarter(this._htmlElementForFocus);
      } else {
        this._spatialNavigableService.registerStarter(this._htmlElementForFocus);
      }
    });
  }

  ngOnDestroy(): void {
    this._spatialNavigableService.unregisterStarter(this._htmlElement);
  }
}
