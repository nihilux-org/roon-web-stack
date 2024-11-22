import { MockProvider } from "ng-mocks";
import { Component, Input, Signal, signal, ViewChild, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SettingsService } from "@services/settings.service";
import { WideLayoutComponent } from "./wide-layout.component";

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
    <nr-wide-layout
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
  imports: [WideLayoutComponent],
})
class TemplateProducerComponent {
  @Input() $layoutClass!: Signal<string>;
  @ViewChild(WideLayoutComponent) wideLayout!: WideLayoutComponent;
}

describe("WideLayoutComponent", () => {
  let component: WideLayoutComponent;
  let fixture: ComponentFixture<TemplateProducerComponent>;
  let $isSmallTablet: WritableSignal<boolean>;
  let $layoutClass: WritableSignal<string>;
  let settingsService: {
    isSmallTablet(): Signal<boolean>;
  };

  beforeEach(() => {
    $layoutClass = signal("layout-class");
    $isSmallTablet = signal(false);
    settingsService = {
      isSmallTablet: () => $isSmallTablet,
    };
    TestBed.configureTestingModule({
      imports: [TemplateProducerComponent, WideLayoutComponent],
      providers: [MockProvider(SettingsService, settingsService)],
    });
    fixture = TestBed.createComponent(TemplateProducerComponent);
    fixture.componentRef.setInput("$layoutClass", $layoutClass);
    fixture.detectChanges();
    component = fixture.componentInstance.wideLayout;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
