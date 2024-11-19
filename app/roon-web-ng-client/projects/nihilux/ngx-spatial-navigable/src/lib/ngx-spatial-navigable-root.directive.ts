import { Directive, ElementRef, OnInit } from "@angular/core";
import { NgxSpatialNavigableService } from "@nihilux/ngx-spatial-navigable";

@Directive({
  standalone: true,
  selector: "[ngxSnRoot]",
})
export class NgxSpatialNavigableRootDirective implements OnInit {
  private readonly _htmlElement: HTMLElement;
  private readonly _spatialNavigableService: NgxSpatialNavigableService;

  constructor(el: ElementRef<HTMLElement>, spatialNavigableService: NgxSpatialNavigableService) {
    this._htmlElement = el.nativeElement;
    this._spatialNavigableService = spatialNavigableService;
  }

  ngOnInit(): void {
    this._spatialNavigableService.registerRoot(this._htmlElement);
  }
}
