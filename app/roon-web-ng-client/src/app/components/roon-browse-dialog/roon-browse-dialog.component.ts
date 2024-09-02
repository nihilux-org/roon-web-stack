import { deepEqual } from "fast-equals";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Inject,
  OnInit,
  Signal,
  signal,
  WritableSignal,
} from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { AlphabeticalIndexComponent } from "@components/alphabetical-index/alphabetical-index.component";
import { CustomActionsManagerComponent } from "@components/custom-actions-manager/custom-actions-manager.component";
import { RoonBrowseListComponent } from "@components/roon-browse-list/roon-browse-list.component";
import { RoonApiBrowseHierarchy, RoonApiBrowseLoadResponse, RoonPath } from "@model";
import { CustomActionsManagerDialogConfig, NavigationEvent, RecordedAction } from "@model/client";
import { CustomActionsService } from "@services/custom-actions.service";
import { DialogService } from "@services/dialog.service";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-roon-browse-dialog",
  standalone: true,
  imports: [
    AlphabeticalIndexComponent,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatIcon,
    MatIconButton,
    MatProgressSpinner,
    RoonBrowseListComponent,
  ],
  templateUrl: "./roon-browse-dialog.component.html",
  styleUrl: "./roon-browse-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoonBrowseDialogComponent implements OnInit {
  private static readonly TITLES_WITH_INDEX = ["Albums", "Artists", "Composers", "My Live Radio", "Playlists", "Tags"];
  private readonly _customActionsService: CustomActionsService;
  private readonly _dialogService: DialogService;
  private readonly _roonService: RoonService;
  private readonly _firstPath: RoonPath;
  private readonly _scrollIndexes: number[];
  readonly isRecording: boolean;
  readonly zoneId: string;
  readonly hierarchy: RoonApiBrowseHierarchy;
  readonly $dialogTitle: WritableSignal<string[]>;
  readonly $loading: WritableSignal<boolean>;
  readonly $itemsInTitle: Signal<number>;
  content?: RoonApiBrowseLoadResponse | undefined = undefined;
  isPaginated: boolean;
  scrollIndex: number;
  withIndex: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { path: RoonPath; isRecording: boolean },
    customActionsService: CustomActionsService,
    dialogService: DialogService,
    roonService: RoonService,
    settingsService: SettingsService,
    dialogRef: MatDialogRef<RoonBrowseDialogComponent>
  ) {
    this.zoneId = settingsService.displayedZoneId()();
    this._customActionsService = customActionsService;
    this._dialogService = dialogService;
    this._roonService = roonService;
    this._firstPath = data.path;
    this._scrollIndexes = [];
    this.hierarchy = data.path.hierarchy;
    this.isRecording = data.isRecording;
    this.$dialogTitle = signal([]);
    this.$loading = signal(true);
    const $isOneColumn = settingsService.isOneColumn();
    this.$itemsInTitle = computed(
      () => {
        if ($isOneColumn()) {
          return 2;
        } else {
          return 3;
        }
      },
      {
        equal: deepEqual,
      }
    );
    this.withIndex = false;
    this.scrollIndex = 0;
    this.isPaginated = true;
    dialogRef.afterClosed().subscribe(() => {
      void this._roonService.browse({
        hierarchy: this.hierarchy,
        pop_all: true,
        set_display_offset: true,
      });
      if (this.isRecording) {
        this._dialogService.open(CustomActionsManagerComponent, {
          ...CustomActionsManagerDialogConfig,
        });
      }
    });
  }

  ngOnInit() {
    this._roonService.loadPath(this.zoneId, this._firstPath).subscribe((content) => {
      this.loadContent(content, 0);
    });
  }

  onTitleClicked(titleIndex: number) {
    this.$loading.set(true);
    const levels = this.$dialogTitle().length - titleIndex - 1;
    if (levels !== 0) {
      let scrollIndex = 0;
      let offset = 0;
      if (this._scrollIndexes[titleIndex]) {
        scrollIndex = this._scrollIndexes[titleIndex];
        this._scrollIndexes.splice(titleIndex, this._scrollIndexes.length - titleIndex);
        offset = scrollIndex - (scrollIndex % 100);
      }
      this._roonService.previous(this.zoneId, this._firstPath.hierarchy, levels, offset).subscribe((content) => {
        this.$dialogTitle.update((dialogTitle) => dialogTitle.slice(0, titleIndex + 1));
        this.isPaginated = true;
        this.loadContent(content, scrollIndex);
      });
    } else {
      this.$loading.set(false);
    }
  }

  onItemClicked(event: NavigationEvent) {
    this.$loading.set(true);
    this._scrollIndexes.push(event.scrollIndex);
    this._roonService
      .navigate(this.zoneId, this._firstPath.hierarchy, event.item_key, event.input)
      .subscribe((content) => {
        this.isPaginated = true;
        this.loadContent(content, 0);
      });
  }

  closeDialog() {
    this._dialogService.close();
  }

  onIndexClicked(letter: string) {
    const list = this.content?.list;
    if (list) {
      this.$loading.set(true);
      void this._roonService
        .findItemIndex({
          hierarchy: this.hierarchy,
          list,
          letter,
          items: !this.isPaginated ? this.content?.items : undefined,
        })
        .then((foundItemIndexResponse) => {
          this.isPaginated = false;
          this.loadContent(foundItemIndexResponse, foundItemIndexResponse.itemIndex);
        })
        .catch(() => {
          this.$loading.set(false);
        });
    }
  }

  onRecordedAction(recordedAction: RecordedAction) {
    const path = [...this.$dialogTitle(), recordedAction.title].slice(1);
    this._customActionsService.saveHierarchy(this._firstPath.hierarchy);
    this._customActionsService.savePath(path);
    this._customActionsService.saveActionIndex(recordedAction.actionIndex);
    this._dialogService.close();
  }

  private loadContent(content: RoonApiBrowseLoadResponse, scrollIndex: number): void {
    const isDeeperTitle = (this.content?.list.level ?? -1) < content.list.level;
    if (isDeeperTitle) {
      this.$dialogTitle.update((dialogTitle) => {
        dialogTitle.push(content.list.title);
        return dialogTitle;
      });
    }
    this.content = content;
    this.scrollIndex = scrollIndex;
    this.withIndex = RoonBrowseDialogComponent.TITLES_WITH_INDEX.includes(content.list.title);
    this.$loading.set(false);
  }
}
