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
  selector: "[nrSnContainer]",
})
export class SpatialNavigableContainerDirective implements OnChanges, OnInit, OnDestroy {
  @Input({ required: false, transform: booleanAttribute }) nrSnPrioritizeChildren: boolean = true;
  @Input({ required: false, transform: booleanAttribute }) nrSnIgnore: boolean = false;
  @Input({ required: false }) nrSnBlockExit: string = "";

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
      } else if (changeKey === "nrSnIgnore") {
        this.setIgnoreClass();
      }
    }
  }

  private setIgnoreClass() {
    if (this.nrSnIgnore) {
      this._renderer.addClass(this._htmlElement, "lrud-ignore");
    } else {
      this._renderer.removeClass(this._htmlElement, "lrud-ignore");
    }
  }

  private setPrioritizeChildren() {
    this._htmlElement.setAttribute("data-lrud-prioritise-children", `${this.nrSnPrioritizeChildren}`);
  }

  private setBlockExit() {
    this._htmlElement.setAttribute("data-block-exit", this.nrSnBlockExit);
  }
}
