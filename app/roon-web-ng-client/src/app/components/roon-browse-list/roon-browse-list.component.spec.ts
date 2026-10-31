import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { inputBinding, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RoonApiBrowseHierarchy, RoonApiBrowseLoadResponse } from "@nihilux/roon-web-model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { RoonBrowseListComponent } from "./roon-browse-list.component";

describe("RoonBrowseListComponent", () => {
  let roonService: {
    load: Mock;
    navigate: Mock;
  };
  let $isOneColumn: WritableSignal<boolean>;
  let $displayModeClass: WritableSignal<string>;
  let $isBigFonts: WritableSignal<boolean>;
  let settingsService: {
    isOneColumn: Mock;
    displayModeClass: Mock;
    isBigFonts: Mock;
  };
  let content: WritableSignal<RoonApiBrowseLoadResponse>;
  let zoneId: WritableSignal<string>;
  let hierarchy: WritableSignal<RoonApiBrowseHierarchy>;
  let isPaginated: WritableSignal<boolean>;
  let isRecording: WritableSignal<boolean>;
  let scrollIndex: WritableSignal<number>;
  let component: RoonBrowseListComponent;
  let fixture: ComponentFixture<RoonBrowseListComponent>;

  beforeEach(async () => {
    roonService = {
      load: vi.fn(),
      navigate: vi.fn(),
    };
    $isBigFonts = signal(false);
    $isOneColumn = signal(false);
    $displayModeClass = signal("wide");
    settingsService = {
      isOneColumn: vi.fn().mockImplementation(() => $isOneColumn),
      displayModeClass: vi.fn().mockImplementation(() => $displayModeClass),
      isBigFonts: vi.fn().mockImplementation(() => $isBigFonts),
    };
    content = signal({
      list: {
        title: "title",
        level: 42,
        count: 420,
      },
      items: [],
      offset: 0,
    });
    zoneId = signal("zone_id");
    hierarchy = signal("browse");
    isPaginated = signal(false);
    isRecording = signal(false);
    scrollIndex = signal(0);
    TestBed.configureTestingModule({
      providers: [MockProvider(RoonService, roonService), MockProvider(SettingsService, settingsService)],
      imports: [RoonBrowseListComponent],
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(RoonBrowseListComponent, {
      bindings: [
        inputBinding("content", content),
        inputBinding("hierarchy", hierarchy),
        inputBinding("isPaginated", isPaginated),
        inputBinding("isRecording", isRecording),
        inputBinding("scrollIndex", scrollIndex),
        inputBinding("zoneId", zoneId),
      ],
    });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
