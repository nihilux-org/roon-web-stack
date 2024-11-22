import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TrackDisplay } from "@model/client";
import { ZoneCurrentTrackComponent } from "./zone-current-track.component";

describe("ZoneCurrentTrackComponent", () => {
  let component: ZoneCurrentTrackComponent;
  let fixture: ComponentFixture<ZoneCurrentTrackComponent>;
  let $isOneColumn: WritableSignal<boolean>;
  let $trackDisplay: WritableSignal<TrackDisplay>;

  beforeEach(() => {
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
    TestBed.configureTestingModule({
      imports: [ZoneCurrentTrackComponent],
    });

    fixture = TestBed.createComponent(ZoneCurrentTrackComponent);
    fixture.componentRef.setInput("$isOneColumn", $isOneColumn);
    fixture.componentRef.setInput("$trackDisplay", $trackDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
