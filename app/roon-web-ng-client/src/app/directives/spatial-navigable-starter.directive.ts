import { booleanAttribute, Directive, ElementRef, Input, OnDestroy, OnInit } from "@angular/core";
import { SpatialNavigationService } from "@services/spatial-navigation.service";

@Directive({
  standalone: true,
  selector: "[nrSnStarter]",
})
export class SpatialNavigableStarterDirective implements OnInit, OnDestroy {
  @Input({ required: false, transform: booleanAttribute }) nrSnIgnore: boolean = false;
  private readonly _htmlElement: HTMLElement;
  private readonly _spatialNavigationService: SpatialNavigationService;

  constructor(el: ElementRef<HTMLElement>, spatialNavigationService: SpatialNavigationService) {
    this._htmlElement = el.nativeElement;
    this._spatialNavigationService = spatialNavigationService;
  }

  ngOnInit(): void {
    if (!this.nrSnIgnore) {
      this._spatialNavigationService.registerStarter(this._htmlElement);
    }
  }

  ngOnDestroy(): void {
    this._spatialNavigationService.unregisterStarter(this._htmlElement);
  }
}
