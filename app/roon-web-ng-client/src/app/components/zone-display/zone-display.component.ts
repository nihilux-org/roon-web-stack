import { Subscription } from "rxjs";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  Input,
  OnDestroy,
  Signal,
  signal,
  WritableSignal,
} from "@angular/core";
import { RoonImageComponent } from "@components/roon-image/roon-image.component";
import { ZoneCommandsComponent } from "@components/zone-commands/zone-commands.component";
import { ZoneProgressionComponent } from "@components/zone-progression/zone-progression.component";
import { ZoneQueueComponent } from "@components/zone-queue/zone-queue.component";
import { EMPTY_TRACK, TrackDisplay, TrackImage } from "@model/client";
import { ResizeService } from "@services/resize.service";

const NOT_READY_IMAGE: TrackImage = {
  src: "",
  imageSise: -1,
  isReady: false,
};

@Component({
  selector: "nr-zone-display",
  standalone: true,
  imports: [RoonImageComponent, ZoneCommandsComponent, ZoneProgressionComponent, ZoneQueueComponent],
  templateUrl: "./zone-display.component.html",
  styleUrl: "./zone-display.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneDisplayComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) $trackDisplay!: Signal<TrackDisplay>;
  $image: Signal<TrackImage>;
  $imageSize: WritableSignal<number>;
  private readonly _resizeService: ResizeService;
  private readonly _zoneImageElement: ElementRef;
  private readonly _changeDetector: ChangeDetectorRef;
  protected readonly EMPTY_TRACK = EMPTY_TRACK;
  private _resizeSubscription?: Subscription;

  constructor(elementRef: ElementRef, resizeService: ResizeService, changeDetector: ChangeDetectorRef) {
    this._resizeService = resizeService;
    this._zoneImageElement = elementRef;
    this._changeDetector = changeDetector;
    this.$imageSize = signal(-1);
    this.$image = computed(() => {
      const src = this.$trackDisplay().image_key;
      const imageSize = this.$imageSize();
      if (src && imageSize !== -1) {
        return {
          src: src,
          imageSise: imageSize,
          isReady: true,
        };
      } else {
        return NOT_READY_IMAGE;
      }
    });
  }

  ngAfterViewInit(): void {
    const zoneDisplayDiv = this._zoneImageElement.nativeElement as HTMLDivElement;
    const zoneImageDiv = zoneDisplayDiv.getElementsByClassName("zone-image")[0] as HTMLDivElement;
    setTimeout(() => {
      this.$imageSize.set(Math.min(zoneImageDiv.offsetWidth - 20, zoneImageDiv.offsetHeight - 20));
    }, 5);
    let firstResize = true;
    this._resizeSubscription = this._resizeService.observeElement(zoneImageDiv).subscribe((resizeEntry) => {
      if (!firstResize) {
        const borderBox = resizeEntry.borderBoxSize[0];
        this.$imageSize.set(Math.min(borderBox.inlineSize - 20, borderBox.blockSize - 20));
        this._changeDetector.detectChanges();
      } else {
        firstResize = false;
      }
    });
  }

  ngOnDestroy() {
    if (this._resizeSubscription) {
      this._resizeSubscription.unsubscribe();
    }
  }
}
