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
  dataRememberLastFocusedChildId,
  ignoredClass,
} from "./ngx-spatial-navigable-utils";

@Directive({
  selector: "[ngxSnContainer]",
})
export class NgxSpatialNavigableContainerDirective implements OnInit, OnDestroy {
  readonly ngxSnPrioritizeChildren = input<boolean, string | boolean>(true, {
    transform: booleanAttribute,
  });
  readonly ngxSnContainerIgnore = input<boolean, string | boolean>(false, {
    transform: booleanAttribute,
  });
  readonly ngxSnContainerRememberLastFocusedChild = input<boolean, string | boolean>(false, {
    transform: booleanAttribute,
  });
  readonly ngxSnBlockExit = input<string>("");
  readonly ngxSnFocusedChildId = input<string>("");

  private readonly _htmlElement: HTMLElement;
  private readonly _renderer: Renderer2;

  constructor() {
    this._htmlElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    this._renderer = inject(Renderer2);
    effect(() => {
      if (this.ngxSnContainerIgnore()) {
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
      this._htmlElement.setAttribute(dataContainerLastFocusChildId, this.ngxSnFocusedChildId());
    });
    effect(() => {
      this._htmlElement.setAttribute(
        dataRememberLastFocusedChildId,
        `${this.ngxSnContainerRememberLastFocusedChild()}`
      );
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
