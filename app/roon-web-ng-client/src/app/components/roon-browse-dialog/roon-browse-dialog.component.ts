import { ChangeDetectionStrategy, Component, Inject, OnInit, signal, WritableSignal } from "@angular/core";
import { MatButton } from "@angular/material/button";
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
import { RoonApiBrowseLoadResponse } from "@model";
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
    MatProgressSpinner,
    RoonBrowseListComponent,
  ],
  templateUrl: "./roon-browse-dialog.component.html",
  styleUrl: "./roon-browse-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoonBrowseDialogComponent implements OnInit {
  private readonly _roonService: RoonService;
  private readonly _dialogRef: MatDialogRef<RoonBrowseDialogComponent>;
  private readonly _firstPage: string;
  content?: RoonApiBrowseLoadResponse | undefined = undefined;
  zoneId: string;
  $dialogTitle: WritableSignal<string[]>;
  $loading: WritableSignal<boolean>;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { firstPage: "library" | "explore" },
    dialogRef: MatDialogRef<RoonBrowseDialogComponent>,
    roonService: RoonService,
    settingsService: SettingsService
  ) {
    this.zoneId = settingsService.displayedZoneId()();
    this._roonService = roonService;
    this._dialogRef = dialogRef;
    this._firstPage = data.firstPage;
    this.$dialogTitle = signal([]);
    this.$loading = signal(true);
  }

  ngOnInit() {
    if (this._firstPage === "library") {
      this._roonService.library(this.zoneId).subscribe((content) => {
        this.loadContent(content);
      });
    } else if (this._firstPage === "explore") {
      this._roonService.explore(this.zoneId).subscribe((content) => {
        this.loadContent(content);
      });
    }
  }

  onTitleClicked(titleIndex: number) {
    this.$loading.set(true);
    if (titleIndex === 0 && this.$dialogTitle().length > 1) {
      if (this._firstPage === "library") {
        this._roonService.library(this.zoneId).subscribe((content) => {
          this.loadContent(content);
        });
      } else if (this._firstPage === "explore") {
        this._roonService.explore(this.zoneId).subscribe((content) => {
          this.loadContent(content);
        });
      }
      this.$dialogTitle.update((dialogTitle) => [dialogTitle[0]]);
    } else {
      const levels = this.$dialogTitle().length - titleIndex - 1;
      if (levels !== 0) {
        this._roonService.previous(this.zoneId, levels).subscribe((content) => {
          this.$dialogTitle.update((dialogTitle) => dialogTitle.slice(0, titleIndex + 1));
          this.loadContent(content);
        });
      } else {
        this.$loading.set(false);
      }
    }
  }

  onItemClicked(event: NavigationEvent) {
    if (event.item_key) {
      this.$loading.set(true);
      this._roonService.navigate(this.zoneId, event.item_key, event.input).subscribe((content) => {
        this.loadContent(content);
      });
    } else {
      this.onTitleClicked(0);
    }
  }

  closeDialog() {
    this._dialogRef.close();
  }

  private loadContent(content: RoonApiBrowseLoadResponse): void {
    const isDeeperTitle = (this.content?.list.level ?? -1) < content.list.level;
    if (isDeeperTitle) {
      this.$dialogTitle.update((dialogTitle) => {
        dialogTitle.push(content.list.title);
        return dialogTitle;
      });
    }
    this.content = content;
    this.$loading.set(false);
  }
}
