import { beforeEach, describe, expect, it } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DEFAULT_ZONE_PROGRESSION, ZoneProgression } from "@model";
import { ZoneProgressionComponent } from "./zone-progression.component";

describe("ZoneProgressionComponent", () => {
  let component: ZoneProgressionComponent;
  let fixture: ComponentFixture<ZoneProgressionComponent>;
  let $zoneProgression: WritableSignal<ZoneProgression>;

  beforeEach(async () => {
    $zoneProgression = signal(DEFAULT_ZONE_PROGRESSION);
    TestBed.configureTestingModule({
      imports: [ZoneProgressionComponent],
    });
    fixture = TestBed.createComponent(ZoneProgressionComponent);
    fixture.componentRef.setInput("$zoneProgression", $zoneProgression);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
