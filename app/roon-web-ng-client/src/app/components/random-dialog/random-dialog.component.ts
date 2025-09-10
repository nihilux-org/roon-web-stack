import { NgFor, NgIf } from "@angular/common";
import { ChangeDetectionStrategy, Component, Signal, WritableSignal, computed, inject, signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialogActions, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { CommandType, RoonApiBrowseLoadResponse } from "@nihilux/roon-web-model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

type GenreState = "none" | "include" | "exclude";
type SortMode = "alpha" | "count";

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
  readonly $counts: WritableSignal<Map<string, number>>;
  readonly $countsLoading: WritableSignal<boolean>;
  readonly $countsError: WritableSignal<boolean>;
  readonly $sortMode: WritableSignal<SortMode>;
  readonly $sortedGenres: Signal<string[]>;

  constructor() {
    this.$zoneId = this._settings.displayedZoneId();
    this.$genres = signal<string[]>([]);
    this.$states = signal(new Map());
    this.$counts = signal(new Map());
    this.$countsLoading = signal(false);
    this.$countsError = signal(false);
    this.$sortMode = signal<SortMode>("alpha");
    this.$sortedGenres = computed(() => {
      const genres = this.$genres();
      const mode = this.$sortMode();
      if (mode === "alpha") {
        return [...genres].sort((a, b) => a.localeCompare(b));
      }
      const counts = this.$counts();
      const score = (g: string) => counts.get(g.trim().toLowerCase()) ?? -1;
      return [...genres].sort((a, b) => score(b) - score(a) || a.localeCompare(b));
    });
    this.loadSavedStates();
    this.loadSavedSortMode();
    this.loadGenres();
    this.loadCounts();
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

  private loadCounts() {
    this.$countsLoading.set(true);
    this.$countsError.set(false);
    try {
      void this._roon
        .genreCounts()
        .then((list) => {
          const m = new Map<string, number>();
          list.forEach((gc) => m.set(gc.title.trim().toLowerCase(), gc.count));
          this.$counts.set(m);
          this.$countsError.set(false);
          // if sorting by count is active before counts arrive, trigger recompute by toggling value
          this.$sortMode.set(this.$sortMode());
        })
        .catch(() => {
          this.$countsError.set(true);
        })
        .finally(() => {
          this.$countsLoading.set(false);
        });
    } catch {
      // Likely called before RoonService is started. Retry shortly.
      setTimeout(() => {
        this.loadCounts();
      }, 1000);
    }
  }

  retryCounts() {
    this.loadCounts();
  }

  countFor(genre: string): number | undefined {
    return this.$counts().get(genre.trim().toLowerCase());
  }

  stateFor(genre: string): GenreState {
    return this.$states().get(genre) ?? "none";
  }

  toggle(genre: string) {
    if (this.isDisabled(genre)) return;
    const map = new Map(this.$states());
    const cur = map.get(genre) ?? "none";
    let next: GenreState;
    switch (cur) {
      case "none":
        next = "include";
        break;
      case "include":
        next = "exclude";
        break;
      case "exclude":
      default:
        next = "none";
        break;
    }
    if (next === "none") map.delete(genre); else map.set(genre, next);
    this.$states.set(map);
    this.saveStates();
  }

  playNow() {
    const { include, exclude } = this.computeFilters();
    const zone_id = this.$zoneId();
    this._roon.command({
      type: CommandType.PLAY_RANDOM_ALBUM,
      data: {
        zone_id,
        included_genres: include.length ? include : undefined,
        excluded_genres: exclude.length ? exclude : undefined,
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
    const exclude: string[] = [];
    this.$states().forEach((v, k) => {
      if (v === "include") include.push(k);
      else if (v === "exclude") exclude.push(k);
    });
    return { include, exclude };
  }

  private saveStates() {
    const { include, exclude } = this.computeFilters();
    localStorage.setItem("nr.RANDOM_FILTERS", JSON.stringify({ include, exclude }));
  }

  isDisabled(genre: string): boolean {
    const c = this.countFor(genre);
    return typeof c === "number" && !this.$countsLoading() && c === 0;
  }

  setSortAlpha() {
    this.$sortMode.set("alpha");
    localStorage.setItem("nr.RANDOM_SORT", "alpha");
  }

  setSortCount() {
    this.$sortMode.set("count");
    localStorage.setItem("nr.RANDOM_SORT", "count");
  }

  private loadSavedSortMode() {
    const raw = localStorage.getItem("nr.RANDOM_SORT");
    if (raw === "alpha" || raw === "count") {
      this.$sortMode.set(raw);
    }
  }
}
