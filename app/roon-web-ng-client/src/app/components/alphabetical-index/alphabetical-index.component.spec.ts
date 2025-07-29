import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AlphabeticalIndexComponent } from "./alphabetical-index.component";

describe("AlphabeticalIndexComponent", () => {
  let component: AlphabeticalIndexComponent;
  let fixture: ComponentFixture<AlphabeticalIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlphabeticalIndexComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlphabeticalIndexComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
