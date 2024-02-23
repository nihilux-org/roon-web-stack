import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Subject } from "rxjs";
import { signal, WritableSignal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { RoonApiBrowseLoadResponse } from "@model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { RoonBrowseDialogComponent } from "./roon-browse-dialog.component";

describe("RoonBrowseDialogComponent", () => {
  const dialogData: {
    firstPage: "library" | "explore";
  } = {
    firstPage: "library",
  };
  let roonService: {
    explore: jest.Mock;
    library: jest.Mock;
    navigate: jest.Mock;
    previous: jest.Mock;
  };
  let settingsService: {
    displayedZoneId: jest.Mock;
  };
  let $zoneId: WritableSignal<string>;
  let closeDialog: jest.Mock;
  let exploreObservable: Subject<RoonApiBrowseLoadResponse>;
  let libraryObservable: Subject<RoonApiBrowseLoadResponse>;
  let navigateObservable: Subject<RoonApiBrowseLoadResponse>;
  let previousObservable: Subject<RoonApiBrowseLoadResponse>;
  let component: RoonBrowseDialogComponent;
  let fixture: MockedComponentFixture<RoonBrowseDialogComponent>;

  beforeEach(async () => {
    closeDialog = jest.fn();
    exploreObservable = new Subject<RoonApiBrowseLoadResponse>();
    libraryObservable = new Subject<RoonApiBrowseLoadResponse>();
    navigateObservable = new Subject<RoonApiBrowseLoadResponse>();
    previousObservable = new Subject<RoonApiBrowseLoadResponse>();
    roonService = {
      explore: jest.fn().mockImplementation(() => exploreObservable),
      library: jest.fn().mockImplementation(() => libraryObservable),
      navigate: jest.fn().mockImplementation(() => navigateObservable),
      previous: jest.fn().mockImplementation(() => previousObservable),
    };
    $zoneId = signal("zone_id");
    settingsService = {
      displayedZoneId: jest.fn().mockImplementation(() => $zoneId),
    };
    await MockBuilder(RoonBrowseDialogComponent)
      .mock(MAT_DIALOG_DATA, dialogData)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .mock(MatDialogRef<RoonBrowseDialogComponent>, {
        close: closeDialog,
      });
    fixture = MockRender(RoonBrowseDialogComponent);
    component = fixture.componentInstance as RoonBrowseDialogComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
