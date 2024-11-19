import { booleanAttribute, Directive, ElementRef, Input, OnDestroy, OnInit } from "@angular/core";
import { NgxSpatialNavigableService } from "@nihilux/ngx-spatial-navigable";

@Directive({
  standalone: true,
  selector: "[ngxSnStarter]",
})
export class NgxSpatialNavigableStarterDirective implements OnInit, OnDestroy {
  @Input({ required: false, transform: booleanAttribute }) ngxSnIgnore: boolean = false;
  private readonly _htmlElement: HTMLElement;
  private readonly _spatialNavigableService: NgxSpatialNavigableService;

  constructor(el: ElementRef<HTMLElement>, spatialNavigableService: NgxSpatialNavigableService) {
    this._htmlElement = el.nativeElement;
    this._spatialNavigableService = spatialNavigableService;
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
