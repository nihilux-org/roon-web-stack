import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TrackDisplay } from "@model";
import { ZoneImageComponent } from "./zone-image.component";

describe("ZoneImageComponent", () => {
  let component: ZoneImageComponent;
  let fixture: ComponentFixture<ZoneImageComponent>;
  let $trackDisplay: WritableSignal<TrackDisplay>;

  beforeEach(() => {
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
      imports: [ZoneImageComponent],
    });

    fixture = TestBed.createComponent(ZoneImageComponent);
    fixture.componentRef.setInput("$trackDisplay", $trackDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
