import { MockProvider } from "ng-mocks";
import { Subject } from "rxjs";
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
    open: jest.Mock;
    close: jest.Mock;
  };
  let roonService: {
    explore: jest.Mock;
    library: jest.Mock;
    navigate: jest.Mock;
    previous: jest.Mock;
    loadPath: jest.Mock;
  };
  let settingsService: {
    displayedZoneId: jest.Mock;
    isBigFonts: jest.Mock;
  };
  let $zoneId: WritableSignal<string>;
  let $isBigFonts: WritableSignal<boolean>;
  let afterClosedDialog: jest.Mock;
  let afterClosedObservable: Subject<void>;
  let exploreObservable: Subject<RoonApiBrowseLoadResponse>;
  let libraryObservable: Subject<RoonApiBrowseLoadResponse>;
  let navigateObservable: Subject<RoonApiBrowseLoadResponse>;
  let previousObservable: Subject<RoonApiBrowseLoadResponse>;
  let loadPathObservable: Subject<RoonApiBrowseLoadResponse>;
  let component: RoonBrowseDialogComponent;
  let fixture: ComponentFixture<RoonBrowseDialogComponent>;

  beforeEach(() => {
    afterClosedObservable = new Subject<void>();
    afterClosedDialog = jest.fn().mockImplementation(() => afterClosedObservable);
    exploreObservable = new Subject<RoonApiBrowseLoadResponse>();
    libraryObservable = new Subject<RoonApiBrowseLoadResponse>();
    navigateObservable = new Subject<RoonApiBrowseLoadResponse>();
    previousObservable = new Subject<RoonApiBrowseLoadResponse>();
    loadPathObservable = new Subject<RoonApiBrowseLoadResponse>();
    dialogService = {
      open: jest.fn(),
      close: jest.fn(),
    };
    roonService = {
      explore: jest.fn().mockImplementation(() => exploreObservable),
      library: jest.fn().mockImplementation(() => libraryObservable),
      navigate: jest.fn().mockImplementation(() => navigateObservable),
      previous: jest.fn().mockImplementation(() => previousObservable),
      loadPath: jest.fn().mockImplementation(() => loadPathObservable),
    };
    $zoneId = signal("zone_id");
    $isBigFonts = signal(false);
    settingsService = {
      displayedZoneId: jest.fn().mockImplementation(() => $zoneId),
      isBigFonts: jest.fn().mockImplementation(() => $isBigFonts),
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
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
