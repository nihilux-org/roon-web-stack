import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { EventEmitter } from "@angular/core";
import { RoonApiBrowseLoadResponse } from "@model";
import { NavigationEvent } from "@model/client";
import { RoonService } from "@services/roon.service";
import { RoonBrowseListComponent } from "./roon-browse-list.component";

describe("RoonBrowseListComponent", () => {
  let roonService: {
    load: jest.Mock;
    navigate: jest.Mock;
  };
  let content: RoonApiBrowseLoadResponse;
  let clickedItem: EventEmitter<NavigationEvent>;
  let zoneId: string;
  let component: RoonBrowseListComponent;
  let fixture: MockedComponentFixture<
    RoonBrowseListComponent,
    {
      content: RoonApiBrowseLoadResponse;
      zoneId: string;
      clickedItem: EventEmitter<NavigationEvent>;
    }
  >;

  beforeEach(async () => {
    roonService = {
      load: jest.fn(),
      navigate: jest.fn(),
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
    clickedItem = new EventEmitter<NavigationEvent>();
    await MockBuilder(RoonBrowseListComponent).mock(RoonService, roonService as Partial<RoonService>);
    fixture = MockRender(RoonBrowseListComponent, {
      content,
      zoneId,
      clickedItem,
    });
    component = fixture.componentInstance as RoonBrowseListComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
