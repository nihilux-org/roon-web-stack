import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RoonImageComponent } from "./roon-image.component";

describe("RoonImageComponent", () => {
  let component: RoonImageComponent;
  let fixture: ComponentFixture<RoonImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoonImageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoonImageComponent);
    component = fixture.componentInstance;
    component.src = "src";
    component.width = 70;
    component.height = 70;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
