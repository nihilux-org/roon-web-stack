import {
  booleanAttribute,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  Renderer2,
} from "@angular/core";
import {
  containerClass,
  dataBlockDirectionAttribute,
  dataContainerConsiderDistanceAttribute,
  dataContainerLastFocusChildId,
  dataContainerPrioritizedChildrenAttribute,
  ignoredClass,
} from "./ngx-spatial-navigable-utils";

@Directive({
  selector: "[ngxSnContainer]",
})
export class NgxSpatialNavigableContainerDirective implements OnInit, OnDestroy {
  readonly ngxSnPrioritizeChildren = input<boolean, string | boolean>(true, {
    transform: booleanAttribute,
  });
  readonly ngxSnIgnore = input<boolean, string | boolean>(false, {
    transform: booleanAttribute,
  });
  readonly ngxSnBlockExit = input<string>("");
  readonly ngxFocusChildId = input<string>("");

  private readonly _htmlElement: HTMLElement;
  private readonly _renderer: Renderer2;

  constructor() {
    this._htmlElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    this._renderer = inject(Renderer2);
    effect(() => {
      if (this.ngxSnIgnore()) {
        this._renderer.addClass(this._htmlElement, ignoredClass);
      } else {
        this._renderer.removeClass(this._htmlElement, ignoredClass);
      }
    });
    effect(() => {
      this._htmlElement.setAttribute(dataBlockDirectionAttribute, this.ngxSnBlockExit());
    });
    effect(() => {
      this._htmlElement.setAttribute(dataContainerPrioritizedChildrenAttribute, `${this.ngxSnPrioritizeChildren()}`);
    });
    effect(() => {
      this._htmlElement.setAttribute(dataContainerLastFocusChildId, this.ngxFocusChildId());
    });
  }

  ngOnInit(): void {
    this._renderer.addClass(this._htmlElement, containerClass);
    this._htmlElement.setAttribute(dataContainerConsiderDistanceAttribute, "true");
  }

  ngOnDestroy() {
    this._renderer.removeClass(this._htmlElement, containerClass);
  }
}
