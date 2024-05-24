import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Signal, signal, WritableSignal } from "@angular/core";
import { TrackDisplay } from "@model/client";
import { ZoneImageComponent } from "./zone-image.component";

describe("ZoneImageComponent", () => {
  let component: ZoneImageComponent;
  let fixture: MockedComponentFixture<ZoneImageComponent, { $trackDisplay: Signal<TrackDisplay> }>;
  let $trackDisplay: WritableSignal<TrackDisplay>;

  beforeEach(async () => {
    $trackDisplay = signal({
      title: "track_title",
      image_key: "track_image_key",
      artist: "track_artist",
      disk: {
        title: "track_disk_title",
        artist: "track_artist",
      },
    });
    await MockBuilder(ZoneImageComponent);

    fixture = MockRender(ZoneImageComponent, {
      $trackDisplay,
    });
    component = fixture.componentInstance as ZoneImageComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
