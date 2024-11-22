import { MockProvider } from "ng-mocks";
import { Component, Input, Signal, signal, ViewChild, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SettingsService } from "@services/settings.service";
import { CompactLayoutComponent } from "./compact-layout.component";

@Component({
  template: `
    <ng-template #zoneActions let-layoutClass="class">
      <div class="zone-actions"></div>
    </ng-template>
    <ng-template #zoneCommands let-layoutClass="class">
      <div class="zone-commands"></div>
    </ng-template>
    <ng-template #zoneCurrentTrack let-layoutClass="class">
      <div class="zone-current-track"></div>
    </ng-template>
    <ng-template #zoneImage let-layoutClass="class">
      <div class="zone-image"></div>
    </ng-template>
    <ng-template #zoneProgression let-layoutClass="class">
      <div class="zone-progression"></div>
    </ng-template>
    <ng-template #zoneQueue let-layoutClass="class">
      <div class="zone-queue"></div>
    </ng-template>
    <ng-template #zoneVolume let-layoutClass="class">
      <div class="zone-volume"></div>
    </ng-template>
    <nr-compact-layout
      [layout]="{
        zoneActions,
        zoneCommands,
        zoneCurrentTrack,
        zoneImage,
        zoneProgression,
        zoneQueue,
        zoneVolume,
        context: {
          class: $layoutClass(),
        },
      }"
    />
  `,
  imports: [CompactLayoutComponent],
})
class TemplateProducerComponent {
  @Input() $layoutClass!: Signal<string>;
  @ViewChild(CompactLayoutComponent) compactLayout!: CompactLayoutComponent;
}

describe("CompactLayoutComponent", () => {
  let component: CompactLayoutComponent;
  let fixture: ComponentFixture<TemplateProducerComponent>;
  let $isSmallTablet: WritableSignal<boolean>;
  let settingsService: {
    isSmallTablet(): Signal<boolean>;
  };
  let $layoutClass: WritableSignal<string>;

  beforeEach(() => {
    $isSmallTablet = signal(false);
    settingsService = {
      isSmallTablet: () => $isSmallTablet,
    };
    $layoutClass = signal("layout-class");
    TestBed.configureTestingModule({
      providers: [MockProvider(SettingsService, settingsService)],
      imports: [CompactLayoutComponent],
    });
    fixture = TestBed.createComponent(TemplateProducerComponent);
    fixture.componentRef.setInput("$layoutClass", $layoutClass);
    fixture.detectChanges();
    component = fixture.componentInstance.compactLayout;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
