import { deepEqual } from "fast-equals";
import { animate, AnimationEvent, state, style, transition, trigger } from "@angular/animations";
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostBinding,
  Input,
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
  animations: [
    trigger("toggleQueue", [
      state(
        "open",
        style({
          height: "100%",
        })
      ),
      state(
        "closed",
        style({
          height: "0",
        })
      ),
      transition("open => closed", [animate("0.3s ease-in")]),
      transition("closed => open", [animate("0.3s ease-out")]),
    ]),
  ],
})
export class ZoneQueueComponent implements AfterViewInit {
  @HostBinding("class.open") open: boolean;
  @Input({ required: true }) $trackDisplay!: Signal<TrackDisplay>;
  private readonly _roonService: RoonService;
  readonly $zoneId: Signal<string>;
  readonly $queue: Signal<QueueTrack[]>;
  readonly $displayQueue: Signal<boolean>;
  readonly $layoutClass: Signal<string>;
  disabled: boolean;
  @ViewChild(CdkVirtualScrollViewport) _virtualScroll?: CdkVirtualScrollViewport;
  @ViewChildren(MatMenuTrigger) _menuTriggers!: QueryList<MatMenuTrigger>;

  constructor(roonService: RoonService, settingsService: SettingsService) {
    this._roonService = roonService;
    this.$displayQueue = settingsService.displayQueueTrack();
    this.open = this.$displayQueue();
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
    this.$layoutClass = settingsService.displayModeClass();
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
    if (this.$displayQueue()) {
      this._virtualScroll?.checkViewportSize();
    } else {
      this.open = false;
    }
  }

  onQueueTrackToggleStart(event: AnimationEvent) {
    if (this.$displayQueue()) {
      this.open = true;
      if ((this._virtualScroll?.getViewportSize() ?? -1) === 0) {
        setTimeout(() => {
          this._virtualScroll?.checkViewportSize();
        }, event.totalTime / 3);
      }
    }
  }

  ngAfterViewInit(): void {
    this.disabled = false;
  }
}
