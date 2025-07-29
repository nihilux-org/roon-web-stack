import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ZoneActionsComponent } from "./zone-actions.component";

describe("ZoneQueueCommandsComponent", () => {
  let component: ZoneActionsComponent;
  let fixture: ComponentFixture<ZoneActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoneActionsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
