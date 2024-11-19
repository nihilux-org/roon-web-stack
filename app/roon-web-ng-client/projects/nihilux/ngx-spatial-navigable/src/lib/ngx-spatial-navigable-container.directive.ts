import {
  booleanAttribute,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
} from "@angular/core";

@Directive({
  standalone: true,
  selector: "[ngxSnContainer]",
})
export class NgxSpatialNavigableContainerDirective implements OnChanges, OnInit, OnDestroy {
  @Input({ required: false, transform: booleanAttribute }) ngxSnPrioritizeChildren: boolean = true;
  @Input({ required: false, transform: booleanAttribute }) ngxSnIgnore: boolean = false;
  @Input({ required: false }) ngxSnBlockExit: string = "";

  private readonly _htmlElement: HTMLElement;
  private readonly _renderer: Renderer2;

  constructor(el: ElementRef<HTMLElement>, renderer: Renderer2) {
    this._htmlElement = el.nativeElement;
    this._renderer = renderer;
    this.setIgnoreClass();
    this.setBlockExit();
    this.setPrioritizeChildren();
  }

  ngOnInit(): void {
    this._renderer.addClass(this._htmlElement, "lrud-container");
  }

  ngOnDestroy() {
    this._renderer.removeClass(this._htmlElement, "lrud-container");
  }

  ngOnChanges(changes: SimpleChanges): void {
    for (const changeKey in changes) {
      if (changeKey === "nrSnPrioritizeChildren") {
        this.setPrioritizeChildren();
      } else if (changeKey === "nrSnBlockExit") {
        this.setBlockExit();
      } else if (changeKey === "ngxSnIgnore") {
        this.setIgnoreClass();
      }
    }
  }

  private setIgnoreClass() {
    if (this.ngxSnIgnore) {
      this._renderer.addClass(this._htmlElement, "lrud-ignore");
    } else {
      this._renderer.removeClass(this._htmlElement, "lrud-ignore");
    }
  }

  private setPrioritizeChildren() {
    this._htmlElement.setAttribute("data-lrud-prioritise-children", `${this.ngxSnPrioritizeChildren}`);
  }

  private setBlockExit() {
    this._htmlElement.setAttribute("data-block-exit", this.ngxSnBlockExit);
  }
}
