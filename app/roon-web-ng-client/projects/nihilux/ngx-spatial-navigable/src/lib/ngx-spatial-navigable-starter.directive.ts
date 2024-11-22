import { booleanAttribute, Directive, ElementRef, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { NgxSpatialNavigableService } from "@nihilux/ngx-spatial-navigable";

@Directive({
  selector: "[ngxSnStarter]",
})
export class NgxSpatialNavigableStarterDirective implements OnInit, OnDestroy {
  @Input({ required: false, transform: booleanAttribute }) ngxSnIgnore: boolean = false;
  private readonly _htmlElement: HTMLElement;
  private readonly _spatialNavigableService: NgxSpatialNavigableService;

  constructor() {
    this._htmlElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    this._spatialNavigableService = inject(NgxSpatialNavigableService);
  }

  ngOnInit(): void {
    if (!this.ngxSnIgnore) {
      this._spatialNavigableService.registerStarter(this._htmlElement);
    }
  }

  ngOnDestroy(): void {
    this._spatialNavigableService.unregisterStarter(this._htmlElement);
  }
}
