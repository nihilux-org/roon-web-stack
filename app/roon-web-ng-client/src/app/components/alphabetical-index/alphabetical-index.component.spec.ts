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
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
