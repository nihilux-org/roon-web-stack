import { Directive, ElementRef, OnInit } from "@angular/core";
import { SpatialNavigationService } from "@services/spatial-navigation.service";

@Directive({
  standalone: true,
  selector: "[nrSnRoot]",
})
export class SpatialNavigableRootDirective implements OnInit {
  private readonly _htmlElement: HTMLElement;
  private readonly _spatialNavigationService: SpatialNavigationService;

  constructor(el: ElementRef<HTMLElement>, spatialNavigationService: SpatialNavigationService) {
    this._htmlElement = el.nativeElement;
    this._spatialNavigationService = spatialNavigationService;
  }

  ngOnInit(): void {
    this._spatialNavigationService.registerRoot(this._htmlElement);
  }
}
