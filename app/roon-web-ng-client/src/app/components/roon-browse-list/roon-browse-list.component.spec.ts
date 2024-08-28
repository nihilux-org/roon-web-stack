import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { EventEmitter, signal, WritableSignal } from "@angular/core";
import { RoonApiBrowseHierarchy, RoonApiBrowseLoadResponse } from "@model";
import { NavigationEvent } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { RoonBrowseListComponent } from "./roon-browse-list.component";

describe("RoonBrowseListComponent", () => {
  let roonService: {
    load: jest.Mock;
    navigate: jest.Mock;
  };
  let $isOneColumn: WritableSignal<boolean>;
  let $displayModeClass: WritableSignal<string>;
  let settingsService: {
    isOneColumn: jest.Mock;
    displayModeClass: jest.Mock;
  };
  let content: RoonApiBrowseLoadResponse;
  let clickedItem: EventEmitter<NavigationEvent>;
  let zoneId: string;
  let hierarchy: RoonApiBrowseHierarchy;
  let scrollIndex: number;
  let component: RoonBrowseListComponent;
  let fixture: MockedComponentFixture<
    RoonBrowseListComponent,
    {
      content: RoonApiBrowseLoadResponse;
      zoneId: string;
      hierarchy: RoonApiBrowseHierarchy;
      scrollIndex: number;
      clickedItem: EventEmitter<NavigationEvent>;
    }
  >;

  beforeEach(async () => {
    roonService = {
      load: jest.fn(),
      navigate: jest.fn(),
    };
    $isOneColumn = signal(false);
    $displayModeClass = signal("wide");
    settingsService = {
      isOneColumn: jest.fn().mockImplementation(() => $isOneColumn),
      displayModeClass: jest.fn().mockImplementation(() => $displayModeClass),
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
    clickedItem = new EventEmitter<NavigationEvent>();
    await MockBuilder(RoonBrowseListComponent)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>);
    fixture = MockRender(RoonBrowseListComponent, {
      content,
      zoneId,
      hierarchy,
      scrollIndex,
      clickedItem,
    });
    component = fixture.componentInstance as RoonBrowseListComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
