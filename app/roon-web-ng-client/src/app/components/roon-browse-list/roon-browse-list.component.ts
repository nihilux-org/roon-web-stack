import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import { CollectionViewer, DataSource } from "@angular/cdk/collections";
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  numberAttribute,
  OnChanges,
  Output,
  QueryList,
  Signal,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatDivider } from "@angular/material/divider";
import { MatFormField, MatHint, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { RoonImageComponent } from "@components/roon-image/roon-image.component";
import { Item, RoonApiBrowseHierarchy, RoonApiBrowseLoadResponse } from "@model";
import { NavigationEvent } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-roon-browse-list",
  standalone: true,
  imports: [
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport,
    MatButton,
    MatDivider,
    MatFormField,
    MatHint,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatMenuTrigger,
    RoonImageComponent,
  ],
  templateUrl: "./roon-browse-list.component.html",
  styleUrl: "./roon-browse-list.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoonBrowseListComponent implements OnChanges, AfterViewInit {
  private static readonly SUBTITLE_SPLITTER = /\s?\/?\s?\[\[\d*\|/;
  private readonly _roonService: RoonService;
  private readonly _inputValues: Map<string, string>;
  private _noActionClicked = true;
  @Input({ required: true }) hierarchy!: RoonApiBrowseHierarchy;
  @Input({ required: true }) zoneId!: string;
  @Input({ required: true }) content!: RoonApiBrowseLoadResponse;
  @Input({ required: true, transform: numberAttribute }) scrollIndex!: number;
  @Output() clickedItem = new EventEmitter<NavigationEvent>();
  @ViewChild(CdkVirtualScrollViewport) _virtualScroll!: CdkVirtualScrollViewport;
  @ViewChildren(MatMenuTrigger) _menuTriggers!: QueryList<MatMenuTrigger>;
  dataSource?: RoonListDataSource;
  readonly $isOneColumn: Signal<boolean>;

  constructor(roonService: RoonService, settingsService: SettingsService) {
    this._roonService = roonService;
    this._inputValues = new Map<string, string>();
    this.$isOneColumn = settingsService.isOneColumn();
  }

  ngOnChanges(changes: SimpleChanges) {
    let updateDataSource = false;
    for (const changeKey in changes) {
      if (changeKey === "content") {
        updateDataSource = true;
      } else if (changeKey === "hierarchy") {
        updateDataSource = true;
      }
    }
    if (updateDataSource) {
      this.dataSource = new RoonListDataSource(this.hierarchy, this.content, this._roonService);
    }
  }

  ngAfterViewInit() {
    if (this.scrollIndex > 1) {
      setTimeout(() => {
        this._virtualScroll.scrollToIndex(this.scrollIndex - 1, "instant");
      });
    }
  }

  // this is needed to clean artists when browsing content form Tidal or Qobuz
  // should be fixed in roon api, but in the meantime, this workaround fixes it
  sanitizeSubtitle(subtitle: string) {
    if (subtitle.startsWith("[[") && subtitle.endsWith("]]")) {
      // FIXME?: this is kind of ugly and not very efficient, a better RegEx/strategy would be welcome
      const sanitizedParts = subtitle.split(RoonBrowseListComponent.SUBTITLE_SPLITTER);
      return sanitizedParts.reduce((str, part) => {
        if (str.length) {
          if (str.endsWith("&")) {
            str = str.concat(" ");
          } else {
            str = str.concat(", ");
          }
        }
        return str.concat(part.replace("]]", ""));
      });
    } else {
      return subtitle;
    }
  }

  onItemClicked(scrollIndex?: number, item_key?: string, hint?: string, hasInput?: boolean) {
    if (item_key && hint === "action_list") {
      this.onActionListClicked(item_key);
    } else if (item_key && hint === "action") {
      this._roonService.navigate(this.zoneId, this.hierarchy, item_key).subscribe(() => {
        this.clickedItem.emit({});
      });
    } else if (item_key) {
      const input = hasInput ? this._inputValues.get(`${item_key}_prompt_input`) : undefined;
      if (hasInput && (input?.trim().length ?? 0) === 0) {
        return;
      }
      this.clickedItem.emit({
        item_key,
        input,
        scrollIndex,
      });
    }
  }

  onActionClicked(item_key: string) {
    this._noActionClicked = false;
    this._roonService.navigate(this.zoneId, this.hierarchy, item_key).subscribe(() => {});
  }

  onPromptInputChange(inputId: string, event: Event) {
    this._inputValues.set(inputId, (event.target as HTMLInputElement).value);
  }

  private onActionListClicked(item_key: string) {
    const menuTrigger = this._menuTriggers.find((mt) => (mt.menuData as string) === item_key);
    if (menuTrigger) {
      if (!menuTrigger.menuOpen) {
        const navigationSub = new Subscription();
        this.navigateToActionList(item_key, menuTrigger, navigationSub, 0);
      } else {
        menuTrigger.closeMenu();
      }
    }
  }

  // this ugly recursive strategy is needed: sometimes roon api tricks us (e.g. for tracks during a search):
  // instead of returning the action_list that was announced by the hint of the clicked item
  // we got a list containing an item that needs to be loaded in order to access the action_list
  // it's a bug regarding the signatures of the api, but this recursive workaround fixes it
  private navigateToActionList(
    item_key: string,
    menuTrigger: MatMenuTrigger,
    navigationSub: Subscription,
    levelToPop: number
  ) {
    levelToPop++;
    navigationSub.add(
      this._roonService.navigate(this.zoneId, this.hierarchy, item_key).subscribe((actionLoadResponse) => {
        if (actionLoadResponse.list.hint === "action_list") {
          menuTrigger.menuData = {
            actions: actionLoadResponse.items,
          };
          menuTrigger.openMenu();
          const menuClosedSub = menuTrigger.menuClosed.subscribe(() => {
            menuTrigger.menuData = item_key;
            if (this._noActionClicked) {
              void this._roonService
                .browse({
                  hierarchy: "browse",
                  pop_levels: levelToPop,
                  zone_or_output_id: this.zoneId,
                  item_key: undefined,
                })
                .then(() => {
                  menuClosedSub.unsubscribe();
                  navigationSub.unsubscribe();
                })
                .catch((err: unknown) => {
                  // eslint-disable-next-line no-console
                  console.error(err);
                });
            } else {
              this._noActionClicked = true;
            }
          });
        } else if (
          actionLoadResponse.items.length > 0 &&
          actionLoadResponse.items[0].hint === "action_list" &&
          actionLoadResponse.items[0].item_key
        ) {
          this.navigateToActionList(actionLoadResponse.items[0].item_key, menuTrigger, navigationSub, levelToPop);
        }
      })
    );
  }
}

class RoonListDataSource extends DataSource<Item | undefined> {
  private readonly _roonService: RoonService;
  private readonly _hierarchy: RoonApiBrowseHierarchy;
  private readonly _pageSize: number;
  private readonly _level: number;
  private readonly _itemSubject: Subject<(Item | undefined)[]>;
  private readonly _subscription: Subscription;
  private readonly _loadedItems: (Item | undefined)[];
  private readonly _loadedOffsets: Set<number>;

  constructor(hierarchy: RoonApiBrowseHierarchy, firstResponse: RoonApiBrowseLoadResponse, roonService: RoonService) {
    super();
    this._roonService = roonService;
    this._hierarchy = hierarchy;
    this._pageSize = 100;
    this._level = firstResponse.list.level;
    this._itemSubject = new BehaviorSubject<(Item | undefined)[]>(firstResponse.items);
    this._subscription = new Subscription();
    // FIXME?: every offset is saved. It's needed to handle direct scroll and the size won't be that big (total / pageSize values), but it's not optimal. Replace by range[]?
    this._loadedOffsets = new Set<number>();
    // FIXME?: Loaded content is kept in memory. It's ok for the sizes we're working with (and smoother for server and user). Should it be optimized?
    this._loadedItems = Array.from(
      {
        length: firstResponse.list.count,
      },
      (_, i) => {
        if (i < firstResponse.items.length) {
          return firstResponse.items[i];
        } else {
          return undefined;
        }
      }
    );
    this._loadedOffsets.add(0);
  }
  override connect(collectionViewer: CollectionViewer): Observable<readonly (Item | undefined)[]> {
    this._subscription.add(
      collectionViewer.viewChange.subscribe((range) => {
        const firstOffset = this.computeOffset(range.start);
        const lastOffset = this.computeOffset(Math.min(range.end - 1, this._loadedItems.length));
        let loadingPromise: Promise<void> = Promise.resolve();
        if (!this._loadedOffsets.has(firstOffset)) {
          this._loadedOffsets.add(firstOffset);
          loadingPromise = loadingPromise.then(() => {
            return this.loadPage(firstOffset);
          });
        }
        if (!this._loadedOffsets.has(lastOffset)) {
          this._loadedOffsets.add(lastOffset);
          loadingPromise = loadingPromise.then(() => {
            return this.loadPage(lastOffset);
          });
        }
        void loadingPromise
          .then(() => {
            this._itemSubject.next(this._loadedItems);
          })
          .catch((err: unknown) => {
            // eslint-disable-next-line no-console
            console.error(err);
          });
      })
    );
    return this._itemSubject;
  }
  override disconnect(): void {
    this._subscription.unsubscribe();
  }

  private computeOffset: (index: number) => number = (index) => {
    return index - (index % this._pageSize);
  };

  private loadPage: (offset: number) => Promise<void> = async (offset) => {
    const pageResponse = await this._roonService.load({
      hierarchy: this._hierarchy,
      level: this._level,
      offset,
    });
    for (let i = 0; i < pageResponse.items.length; i++) {
      this._loadedItems[i + offset] = pageResponse.items[i];
    }
  };
}
