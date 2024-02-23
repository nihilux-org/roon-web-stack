import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ZoneProgressionComponent } from "./zone-progression.component";

describe("ZoneProgressionComponent", () => {
  let component: ZoneProgressionComponent;
  let fixture: ComponentFixture<ZoneProgressionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneProgressionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoneProgressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
