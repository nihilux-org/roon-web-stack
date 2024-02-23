import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { ChangeDetectionStrategy, Component, computed, QueryList, Signal, ViewChildren } from "@angular/core";
import { MatDividerModule } from "@angular/material/divider";
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { RoonImageComponent } from "@components/roon-image/roon-image.component";
import { ZoneQueueCommandsComponent } from "@components/zone-queue-commands/zone-queue-commands.component";
import { CommandType } from "@model";
import { EMPTY_QUEUE_TRACK, QueueDisplay } from "@model/client";
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
    ZoneQueueCommandsComponent,
  ],
  templateUrl: "./zone-queue.component.html",
  styleUrl: "./zone-queue.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneQueueComponent {
  private readonly _roonService: RoonService;
  readonly $zoneId: Signal<string>;
  readonly $queue: Signal<QueueDisplay>;
  @ViewChildren(MatMenuTrigger) _menuTriggers!: QueryList<MatMenuTrigger>;
  protected readonly EMPTY_TRACK_QUEUE_TRACK = EMPTY_QUEUE_TRACK;

  constructor(roonService: RoonService, settingsService: SettingsService) {
    this._roonService = roonService;
    this.$zoneId = settingsService.displayedZoneId();
    this.$queue = computed(() => {
      const queueState = this._roonService.queueState(this.$zoneId)();
      if (queueState.tracks.length > 0) {
        const currentTrack = queueState.tracks[0];
        const queue = [...queueState.tracks].splice(1);
        return {
          currentTrack,
          queue,
        };
      } else {
        return {
          currentTrack: EMPTY_QUEUE_TRACK,
          queue: [],
        };
      }
    });
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
  }
}
