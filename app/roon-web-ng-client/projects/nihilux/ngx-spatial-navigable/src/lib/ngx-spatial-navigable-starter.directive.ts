import { booleanAttribute, Directive, effect, ElementRef, inject, input, OnDestroy } from "@angular/core";
import { NgxSpatialNavigableService } from "@nihilux/ngx-spatial-navigable";

@Directive({
  selector: "[ngxSnStarter]",
})
export class NgxSpatialNavigableStarterDirective implements OnDestroy {
  readonly ngxSnIgnore = input<boolean, string | boolean>(false, {
    transform: booleanAttribute,
  });
  private readonly _htmlElement: HTMLElement;
  private readonly _spatialNavigableService: NgxSpatialNavigableService;

  constructor() {
    this._htmlElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    this._spatialNavigableService = inject(NgxSpatialNavigableService);
    effect(() => {
      if (this.ngxSnIgnore()) {
        this._spatialNavigableService.unregisterStarter(this._htmlElement);
      } else {
        this._spatialNavigableService.registerStarter(this._htmlElement);
      }
    });
  }

  ngOnDestroy(): void {
    this._spatialNavigableService.unregisterStarter(this._htmlElement);
  }
}
