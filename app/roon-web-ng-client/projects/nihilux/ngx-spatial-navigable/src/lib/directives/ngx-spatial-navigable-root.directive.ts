import { Directive, ElementRef, inject, OnInit } from "@angular/core";
import { NgxSpatialNavigableService } from "@nihilux/ngx-spatial-navigable";

@Directive({
  selector: "[ngxSnRoot]",
})
export class NgxSpatialNavigableRootDirective implements OnInit {
  private readonly _htmlElement: HTMLElement;
  private readonly _spatialNavigableService: NgxSpatialNavigableService;

  constructor() {
    this._htmlElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    this._spatialNavigableService = inject(NgxSpatialNavigableService);
  }

  ngOnInit(): void {
    this._spatialNavigableService.registerRoot(this._htmlElement);
  }
}
