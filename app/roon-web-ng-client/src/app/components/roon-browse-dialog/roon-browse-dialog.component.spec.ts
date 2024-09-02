import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Subject } from "rxjs";
import { signal, WritableSignal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { RoonApiBrowseLoadResponse, RoonPath } from "@model";
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
  };
  let $zoneId: WritableSignal<string>;
  let afterClosedDialog: jest.Mock;
  let afterClosedObservable: Subject<void>;
  let exploreObservable: Subject<RoonApiBrowseLoadResponse>;
  let libraryObservable: Subject<RoonApiBrowseLoadResponse>;
  let navigateObservable: Subject<RoonApiBrowseLoadResponse>;
  let previousObservable: Subject<RoonApiBrowseLoadResponse>;
  let loadPathObservable: Subject<RoonApiBrowseLoadResponse>;
  let component: RoonBrowseDialogComponent;
  let fixture: MockedComponentFixture<RoonBrowseDialogComponent>;

  beforeEach(async () => {
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
    settingsService = {
      displayedZoneId: jest.fn().mockImplementation(() => $zoneId),
    };
    await MockBuilder(RoonBrowseDialogComponent)
      .mock(MAT_DIALOG_DATA, dialogData)
      .mock(DialogService, dialogService as Partial<DialogService>)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .mock(MatDialogRef<RoonBrowseDialogComponent>, {
        afterClosed: afterClosedDialog,
      });
    fixture = MockRender(RoonBrowseDialogComponent);
    component = fixture.componentInstance as RoonBrowseDialogComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
