import {
  booleanAttribute,
  Directive,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
} from "@angular/core";
import {
  containerClass,
  dataBlockDirectionAttribute,
  dataContainerLastFocusChildId,
  dataContainerPrioritizedChildrenAttribute,
  ignoredClass,
} from "./ngx-spatial-navigable-next-focus-finder";

@Directive({
  selector: "[ngxSnContainer]",
})
export class NgxSpatialNavigableContainerDirective implements OnChanges, OnInit, OnDestroy {
  @Input({ required: false, transform: booleanAttribute }) ngxSnPrioritizeChildren: boolean = true;
  @Input({ required: false, transform: booleanAttribute }) ngxSnIgnore: boolean = false;
  @Input({ required: false }) ngxSnBlockExit: string = "";
  @Input({ required: false }) ngxFocusChildId: string = "";

  private readonly _htmlElement: HTMLElement;
  private readonly _renderer: Renderer2;

  constructor() {
    this._htmlElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    this._renderer = inject(Renderer2);
    this.setIgnoreClass();
    this.setBlockExit();
    this.setPrioritizeChildren();
  }

  ngOnInit(): void {
    this._renderer.addClass(this._htmlElement, containerClass);
  }

  ngOnDestroy() {
    this._renderer.removeClass(this._htmlElement, containerClass);
  }

  ngOnChanges(changes: SimpleChanges): void {
    for (const changeKey in changes) {
      if (changeKey === "ngxSnPrioritizeChildren") {
        this.setPrioritizeChildren();
      } else if (changeKey === "ngxSnBlockExit") {
        this.setBlockExit();
      } else if (changeKey === "ngxSnIgnore") {
        this.setIgnoreClass();
      } else if (changeKey === "ngxFocusChildId") {
        this._htmlElement.setAttribute(dataContainerLastFocusChildId, changes[changeKey].currentValue as string);
      }
    }
  }

  private setIgnoreClass() {
    if (this.ngxSnIgnore) {
      this._renderer.addClass(this._htmlElement, ignoredClass);
    } else {
      this._renderer.removeClass(this._htmlElement, ignoredClass);
    }
  }

  private setPrioritizeChildren() {
    this._htmlElement.setAttribute(dataContainerPrioritizedChildrenAttribute, `${this.ngxSnPrioritizeChildren}`);
  }

  private setBlockExit() {
    this._htmlElement.setAttribute(dataBlockDirectionAttribute, this.ngxSnBlockExit);
  }
}
