import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ZoneQueueCommandsComponent } from "./zone-queue-commands.component";

describe("ZoneQueueCommandsComponent", () => {
  let component: ZoneQueueCommandsComponent;
  let fixture: ComponentFixture<ZoneQueueCommandsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneQueueCommandsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoneQueueCommandsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
