import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FullScreenToggleComponent } from "./full-screen-toggle.component";

describe("FullScreenToggleComponent", () => {
  let component: FullScreenToggleComponent;
  let fixture: ComponentFixture<FullScreenToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FullScreenToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FullScreenToggleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
