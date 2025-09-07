import { NgFor, NgIf } from "@angular/common";
import { ChangeDetectionStrategy, Component, Signal, WritableSignal, computed, inject, signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialogActions, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { CommandType, RoonApiBrowseLoadResponse } from "@nihilux/roon-web-model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

type GenreState = "none" | "include";

@Component({
  selector: "nr-random-dialog",
  imports: [MatDialogActions, MatDialogContent, MatButton, MatIcon, NgFor, NgIf],
  templateUrl: "./random-dialog.component.html",
  styleUrl: "./random-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RandomDialogComponent {
  private readonly _settings = inject(SettingsService);
  private readonly _roon = inject(RoonService);
  private readonly _dialogRef = inject(MatDialogRef<RandomDialogComponent>);

  readonly $zoneId: Signal<string>;
  readonly $genres: WritableSignal<string[]>;
  readonly $states: WritableSignal<Map<string, GenreState>>;

  constructor() {
    this.$zoneId = this._settings.displayedZoneId();
    this.$genres = signal<string[]>([]);
    this.$states = signal(new Map());
    this.loadSavedStates();
    this.loadGenres();
  }

  private loadSavedStates() {
    const raw = localStorage.getItem("nr.RANDOM_FILTERS");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { include?: string[] };
        const map = new Map<string, GenreState>();
        parsed.include?.forEach((g) => map.set(g, "include"));
        this.$states.set(map);
      } catch {
        // ignore
      }
    }
  }

  private loadGenres() {
    const zoneId = this.$zoneId();
    const acc = new Set<string>();
    const page = (offset: number): Promise<void> => {
      return this._roon
        .load({ hierarchy: "genres", offset, count: 100 })
        .then((lr: RoonApiBrowseLoadResponse) => {
          lr.items.forEach((it) => {
            if (it.title) acc.add(it.title);
          });
          const total = lr.list.count;
          if (offset + 100 < total) {
            return page(offset + 100);
          }
          return;
        })
        .catch(() => undefined as void);
    };
    void this._roon
      .browse({ hierarchy: "genres", zone_or_output_id: zoneId })
      .then(() => page(0))
      .finally(() => this.$genres.set(Array.from(acc).sort((a, b) => a.localeCompare(b))));
  }

  stateFor(genre: string): GenreState {
    return this.$states().get(genre) ?? "none";
  }

  toggle(genre: string) {
    const map = new Map(this.$states());
    const cur = map.get(genre) ?? "none";
    const next: GenreState = cur === "none" ? "include" : "none";
    if (next === "none") map.delete(genre); else map.set(genre, next);
    this.$states.set(map);
    this.saveStates();
  }

  playNow() {
    const { include } = this.computeFilters();
    const zone_id = this.$zoneId();
    this._roon.command({
      type: CommandType.PLAY_RANDOM_ALBUM,
      data: {
        zone_id,
        included_genres: include.length ? include : undefined,
      },
    });
    this._dialogRef.close();
  }

  clearAll() {
    this.$states.set(new Map());
    this.saveStates();
  }

  private computeFilters() {
    const include: string[] = [];
    this.$states().forEach((v, k) => { if (v === "include") include.push(k); });
    return { include };
  }

  private saveStates() {
    const { include } = this.computeFilters();
    localStorage.setItem("nr.RANDOM_FILTERS", JSON.stringify({ include }));
  }
}
