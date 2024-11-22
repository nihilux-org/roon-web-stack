import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DEFAULT_ZONE_PROGRESSION, ZoneProgression } from "@model/client";
import { ZoneProgressionComponent } from "./zone-progression.component";

describe("ZoneProgressionComponent", () => {
  let component: ZoneProgressionComponent;
  let fixture: ComponentFixture<ZoneProgressionComponent>;
  let $zoneProgression: WritableSignal<ZoneProgression>;

  beforeEach(() => {
    $zoneProgression = signal(DEFAULT_ZONE_PROGRESSION);
    TestBed.configureTestingModule({
      imports: [ZoneProgressionComponent],
    });
    fixture = TestBed.createComponent(ZoneProgressionComponent);
    fixture.componentRef.setInput("$zoneProgression", $zoneProgression);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
