import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Signal, signal, WritableSignal } from "@angular/core";
import { DEFAULT_ZONE_PROGRESSION, ZoneProgression } from "@model/client";
import { ZoneProgressionComponent } from "./zone-progression.component";

describe("ZoneProgressionComponent", () => {
  let component: ZoneProgressionComponent;
  let fixture: MockedComponentFixture<ZoneProgressionComponent, { $zoneProgression: Signal<ZoneProgression> }>;
  let $zoneProgression: WritableSignal<ZoneProgression>;

  beforeEach(async () => {
    $zoneProgression = signal(DEFAULT_ZONE_PROGRESSION);
    await MockBuilder(ZoneProgressionComponent);
    fixture = MockRender(ZoneProgressionComponent, {
      $zoneProgression,
    });
    component = fixture.componentInstance as ZoneProgressionComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
