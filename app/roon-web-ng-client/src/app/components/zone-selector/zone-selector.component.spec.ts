import { MockProvider } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ApiState, RoonState } from "@nihilux/roon-web-model";
import { RoonService } from "@services/roon.service";
import { ZoneSelectorComponent } from "./zone-selector.component";

describe("ZoneSelectorComponent", () => {
  let component: ZoneSelectorComponent;
  let fixture: ComponentFixture<ZoneSelectorComponent>;
  let $roonState: WritableSignal<ApiState>;

  beforeEach(async () => {
    $roonState = signal({
      state: RoonState.SYNC,
      zones: [],
      outputs: [],
    });
    await TestBed.configureTestingModule({
      imports: [ZoneSelectorComponent],
      providers: [
        MockProvider(RoonService, {
          roonState: () => $roonState,
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
