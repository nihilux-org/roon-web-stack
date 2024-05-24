import { deepEqual } from "fast-equals";
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EffectRef,
  HostBinding,
  Input,
  OnDestroy,
  QueryList,
  Signal,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { MatDividerModule } from "@angular/material/divider";
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { RoonImageComponent } from "@components/roon-image/roon-image.component";
import { CommandType, QueueTrack } from "@model";
import { TrackDisplay } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-queue",
  standalone: true,
  imports: [
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport,
    MatDividerModule,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatMenuTrigger,
    RoonImageComponent,
  ],
  templateUrl: "./zone-queue.component.html",
  styleUrl: "./zone-queue.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneQueueComponent implements OnDestroy, AfterViewInit {
  @HostBinding("class.open") open: boolean;
  @Input({ required: true }) $trackDisplay!: Signal<TrackDisplay>;
  private readonly _roonService: RoonService;
  private readonly _openEffect: EffectRef;
  readonly $zoneId: Signal<string>;
  readonly $queue: Signal<QueueTrack[]>;
  readonly $displayQueue: Signal<boolean>;
  disabled: boolean;
  @ViewChild(CdkVirtualScrollViewport) _virtualScroll?: CdkVirtualScrollViewport;
  @ViewChildren(MatMenuTrigger) _menuTriggers!: QueryList<MatMenuTrigger>;

  constructor(roonService: RoonService, settingsService: SettingsService) {
    this._roonService = roonService;
    this.$displayQueue = settingsService.displayQueueTrack();
    this.open = this.$displayQueue();
    this._openEffect = effect(() => {
      this.open = this.$displayQueue();
    });
    this.$zoneId = settingsService.displayedZoneId();
    this.$queue = computed(
      () => {
        const queueState = this._roonService.queueState(this.$zoneId)();
        const currentTrack = this.$trackDisplay();
        if (queueState.tracks.length > 0 && currentTrack.title === queueState.tracks[0].title) {
          return [...queueState.tracks].splice(1);
        } else {
          return queueState.tracks;
        }
      },
      {
        equal: deepEqual,
      }
    );
    this.disabled = true;
  }

  openActionMenu(queue_item_id: number) {
    const menuTrigger = this._menuTriggers.find((mt) => mt.menuData === queue_item_id);
    if (menuTrigger) {
      menuTrigger.menuData = { queue_item_id };
      menuTrigger.openMenu();
      const closeSub = menuTrigger.menuClosed.subscribe(() => {
        menuTrigger.menuData = queue_item_id;
        closeSub.unsubscribe();
      });
    }
  }

  onPlayFromHere(queue_item_id: number) {
    this._roonService.command({
      type: CommandType.PLAY_FROM_HERE,
      data: {
        zone_id: this.$zoneId(),
        queue_item_id: `${queue_item_id}`,
      },
    });
    this._virtualScroll?.scrollToIndex(0, "instant");
  }

  onQueueTrackToggled() {
    this._virtualScroll?.checkViewportSize();
  }

  ngOnDestroy(): void {
    this._openEffect.destroy();
  }

  ngAfterViewInit(): void {
    this.disabled = false;
  }
}
