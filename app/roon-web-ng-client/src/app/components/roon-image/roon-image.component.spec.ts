import { beforeEach, describe, expect, it } from "vitest";
import { inputBinding, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RoonImageComponent } from "./roon-image.component";

describe("RoonImageComponent", () => {
  let component: RoonImageComponent;
  let fixture: ComponentFixture<RoonImageComponent>;
  let alt: WritableSignal<string>;
  let src: WritableSignal<string>;
  let height: WritableSignal<number>;
  let width: WritableSignal<number>;

  beforeEach(async () => {
    alt = signal("alt");
    src = signal("src");
    height = signal(70);
    width = signal(70);

    await TestBed.configureTestingModule({
      imports: [RoonImageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoonImageComponent, {
      bindings: [
        inputBinding("alt", alt),
        inputBinding("src", src),
        inputBinding("height", height),
        inputBinding("width", width),
      ],
    });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
