import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Signal, signal, WritableSignal } from "@angular/core";
import { TrackDisplay } from "@model/client";
import { ZoneCurrentTrackComponent } from "./zone-current-track.component";

describe("ZoneCurrentTrackComponent", () => {
  let component: ZoneCurrentTrackComponent;
  let fixture: MockedComponentFixture<
    ZoneCurrentTrackComponent,
    { $trackDisplay: Signal<TrackDisplay>; $isOneColumn: Signal<boolean> }
  >;
  let $isOneColumn: WritableSignal<boolean>;
  let $trackDisplay: WritableSignal<TrackDisplay>;

  beforeEach(async () => {
    $isOneColumn = signal(false);
    $trackDisplay = signal({
      title: "track_title",
      image_key: "track_image_key",
      artist: "track_artist",
      disk: {
        title: "track_disk_title",
        artist: "track_artist",
      },
    });
    await MockBuilder(ZoneCurrentTrackComponent);

    fixture = MockRender(ZoneCurrentTrackComponent, {
      $isOneColumn,
      $trackDisplay,
    });
    component = fixture.componentInstance as ZoneCurrentTrackComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
