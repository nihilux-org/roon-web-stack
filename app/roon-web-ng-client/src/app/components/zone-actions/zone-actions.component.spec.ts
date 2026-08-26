import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ROON_WORKER } from "@services/roon.worker.provider";
import { ZoneActionsComponent } from "./zone-actions.component";

describe("ZoneQueueCommandsComponent", () => {
  let component: ZoneActionsComponent;
  let fixture: ComponentFixture<ZoneActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneActionsComponent],
      providers: [
        {
          provide: ROON_WORKER,
          useFactory: () => ({
            terminate: vi.fn(),
          }),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoneActionsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
