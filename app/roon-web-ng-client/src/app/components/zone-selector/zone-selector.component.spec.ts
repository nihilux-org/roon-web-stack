import { MockProvider } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ZoneDescription } from "@model";
import { RoonService } from "@services/roon.service";
import { ZoneSelectorComponent } from "./zone-selector.component";

describe("ZoneSelectorComponent", () => {
  let component: ZoneSelectorComponent;
  let fixture: ComponentFixture<ZoneSelectorComponent>;
  let $zones: WritableSignal<ZoneDescription[]>;

  beforeEach(async () => {
    $zones = signal([]);
    await TestBed.configureTestingModule({
      imports: [ZoneSelectorComponent],
      providers: [
        MockProvider(RoonService, {
          zones: () => $zones,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoneSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
