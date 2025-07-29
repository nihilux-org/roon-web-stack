import { MockProvider } from "ng-mocks";
import { Subject } from "rxjs";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { RoonApiBrowseLoadResponse, RoonPath } from "@nihilux/roon-web-model";
import { DialogService } from "@services/dialog.service";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { RoonBrowseDialogComponent } from "./roon-browse-dialog.component";

describe("RoonBrowseDialogComponent", () => {
  const path: RoonPath = {
    hierarchy: "playlists",
    path: [],
  };
  const dialogData: {
    path: RoonPath;
  } = {
    path,
  };
  let dialogService: {
    open: Mock;
    close: Mock;
  };
  let roonService: {
    explore: Mock;
    library: Mock;
    navigate: Mock;
    previous: Mock;
    loadPath: Mock;
  };
  let settingsService: {
    displayedZoneId: Mock;
    isBigFonts: Mock;
  };
  let $zoneId: WritableSignal<string>;
  let $isBigFonts: WritableSignal<boolean>;
  let afterClosedDialog: Mock;
  let afterClosedObservable: Subject<void>;
  let exploreObservable: Subject<RoonApiBrowseLoadResponse>;
  let libraryObservable: Subject<RoonApiBrowseLoadResponse>;
  let navigateObservable: Subject<RoonApiBrowseLoadResponse>;
  let previousObservable: Subject<RoonApiBrowseLoadResponse>;
  let loadPathObservable: Subject<RoonApiBrowseLoadResponse>;
  let component: RoonBrowseDialogComponent;
  let fixture: ComponentFixture<RoonBrowseDialogComponent>;

  beforeEach(async () => {
    afterClosedObservable = new Subject<void>();
    afterClosedDialog = vi.fn().mockImplementation(() => afterClosedObservable);
    exploreObservable = new Subject<RoonApiBrowseLoadResponse>();
    libraryObservable = new Subject<RoonApiBrowseLoadResponse>();
    navigateObservable = new Subject<RoonApiBrowseLoadResponse>();
    previousObservable = new Subject<RoonApiBrowseLoadResponse>();
    loadPathObservable = new Subject<RoonApiBrowseLoadResponse>();
    dialogService = {
      open: vi.fn(),
      close: vi.fn(),
    };
    roonService = {
      explore: vi.fn().mockImplementation(() => exploreObservable),
      library: vi.fn().mockImplementation(() => libraryObservable),
      navigate: vi.fn().mockImplementation(() => navigateObservable),
      previous: vi.fn().mockImplementation(() => previousObservable),
      loadPath: vi.fn().mockImplementation(() => loadPathObservable),
    };
    $zoneId = signal("zone_id");
    $isBigFonts = signal(false);
    settingsService = {
      displayedZoneId: vi.fn().mockImplementation(() => $zoneId),
      isBigFonts: vi.fn().mockImplementation(() => $isBigFonts),
    };
    TestBed.configureTestingModule({
      providers: [
        MockProvider(MAT_DIALOG_DATA, dialogData),
        MockProvider(DialogService, dialogService),
        MockProvider(RoonService, roonService),
        MockProvider(SettingsService, settingsService),
        MockProvider(MatDialogRef<RoonBrowseDialogComponent>, {
          afterClosed: afterClosedDialog,
        }),
      ],
      imports: [RoonBrowseDialogComponent],
    });
    fixture = TestBed.createComponent(RoonBrowseDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
