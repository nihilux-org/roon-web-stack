import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { signal, WritableSignal } from "@angular/core";
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
  let content: RoonApiBrowseLoadResponse;
  let zoneId: string;
  let hierarchy: RoonApiBrowseHierarchy;
  let scrollIndex: number;
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
    content = {
      list: {
        title: "title",
        level: 42,
        count: 420,
      },
      items: [],
      offset: 0,
    };
    zoneId = "zone_id";
    hierarchy = "browse";
    scrollIndex = 0;
    TestBed.configureTestingModule({
      providers: [MockProvider(RoonService, roonService), MockProvider(SettingsService, settingsService)],
      imports: [RoonBrowseListComponent],
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(RoonBrowseListComponent);
    fixture.componentRef.setInput("content", content);
    fixture.componentRef.setInput("hierarchy", hierarchy);
    fixture.componentRef.setInput("scrollIndex", scrollIndex);
    fixture.componentRef.setInput("zoneId", zoneId);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
