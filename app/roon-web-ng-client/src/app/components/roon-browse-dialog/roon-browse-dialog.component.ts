import { deepEqual } from "fast-equals";
import { Subscription } from "rxjs";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Inject,
  OnDestroy,
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
import { RoonBrowseListComponent } from "@components/roon-browse-list/roon-browse-list.component";
import { RoonApiBrowseHierarchy, RoonApiBrowseLoadResponse, RoonPath } from "@model";
import { NavigationEvent } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-roon-browse-dialog",
  standalone: true,
  imports: [
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
export class RoonBrowseDialogComponent implements OnInit, OnDestroy {
  private readonly _roonService: RoonService;
  private readonly _dialogRef: MatDialogRef<RoonBrowseDialogComponent>;
  private readonly _firstPath: RoonPath;
  private readonly _scrollIndexes: number[];
  private readonly _dialogCloseSub: Subscription;
  content?: RoonApiBrowseLoadResponse | undefined = undefined;
  readonly zoneId: string;
  readonly hierarchy: RoonApiBrowseHierarchy;
  readonly $dialogTitle: WritableSignal<string[]>;
  readonly $loading: WritableSignal<boolean>;
  readonly $itemsInTitle: Signal<number>;
  scrollIndex: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { path: RoonPath },
    dialogRef: MatDialogRef<RoonBrowseDialogComponent>,
    roonService: RoonService,
    settingsService: SettingsService
  ) {
    this.zoneId = settingsService.displayedZoneId()();
    this._roonService = roonService;
    this._dialogRef = dialogRef;
    this._firstPath = data.path;
    this._scrollIndexes = [];
    this.hierarchy = data.path.hierarchy;
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
    this.scrollIndex = 0;
    this._dialogCloseSub = this._dialogRef.beforeClosed().subscribe(() => {
      void this._roonService.browse({
        hierarchy: this.hierarchy,
        pop_all: true,
        set_display_offset: true,
      });
    });
  }

  ngOnInit() {
    this._roonService.loadPath(this.zoneId, this._firstPath).subscribe((content) => {
      this.loadContent(content);
    });
  }

  ngOnDestroy() {
    this._dialogCloseSub.unsubscribe();
  }

  onTitleClicked(titleIndex: number) {
    this.$loading.set(true);
    const levels = this.$dialogTitle().length - titleIndex - 1;
    if (levels !== 0) {
      this._roonService.previous(this.zoneId, this._firstPath.hierarchy, levels).subscribe((content) => {
        this.$dialogTitle.update((dialogTitle) => dialogTitle.slice(0, titleIndex + 1));
        let scrollIndex: number | undefined = undefined;
        if (this._scrollIndexes[titleIndex]) {
          scrollIndex = this._scrollIndexes[titleIndex];
          this._scrollIndexes.splice(titleIndex, this._scrollIndexes.length - titleIndex);
        }
        this.loadContent(content, scrollIndex);
      });
    } else {
      this.$loading.set(false);
    }
  }

  onItemClicked(event: NavigationEvent) {
    if (event.item_key) {
      this.$loading.set(true);
      if (event.scrollIndex) {
        this._scrollIndexes.push(event.scrollIndex);
      }
      this._roonService
        .navigate(this.zoneId, this._firstPath.hierarchy, event.item_key, event.input)
        .subscribe((content) => {
          this.loadContent(content);
        });
    } else {
      this.onTitleClicked(0);
    }
  }

  closeDialog() {
    this._dialogRef.close();
  }

  private loadContent(content: RoonApiBrowseLoadResponse, scrollIndexToRestore?: number): void {
    const isDeeperTitle = (this.content?.list.level ?? -1) < content.list.level;
    if (isDeeperTitle) {
      this.$dialogTitle.update((dialogTitle) => {
        dialogTitle.push(content.list.title);
        return dialogTitle;
      });
    }
    if (scrollIndexToRestore) {
      this.scrollIndex = scrollIndexToRestore;
    } else {
      this.scrollIndex = 0;
    }
    this.content = content;
    this.$loading.set(false);
  }
}
