import { MockComponent, MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { Component, Input, Signal, signal, ViewChild, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ZoneSelectorComponent } from "@components/zone-selector/zone-selector.component";
import { DialogService } from "@services/dialog.service";
import { IdleService } from "@services/idle.service";
import { SettingsService } from "@services/settings.service";
import { TenFeetLayoutComponent } from "./ten-feet-layout.component";

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
    <nr-ten-feet-layout
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
  imports: [TenFeetLayoutComponent],
})
class TemplateProducerComponent {
  @Input() $layoutClass!: Signal<string>;
  @ViewChild(TenFeetLayoutComponent) tenFeetLayoutComponent!: TenFeetLayoutComponent;
}

describe("TenFeetLayoutComponent", () => {
  let component: TenFeetLayoutComponent;
  let fixture: ComponentFixture<TemplateProducerComponent>;
  let $layoutClass: WritableSignal<string>;
  let $isIdle: WritableSignal<boolean>;
  let $isBigFonts: WritableSignal<boolean>;
  let settingsService: {
    isBigFonts: Mock;
  };
  let idleService: {
    isIdle: Mock;
  };
  let closeDialog: Mock;

  beforeEach(async () => {
    $layoutClass = signal("layout-class");
    $isIdle = signal(false);
    $isBigFonts = signal(false);
    settingsService = {
      isBigFonts: vi.fn().mockImplementation(() => $isBigFonts),
    };
    idleService = {
      isIdle: vi.fn().mockImplementation(() => $isIdle),
    };
    closeDialog = vi.fn();
    TestBed.configureTestingModule({
      imports: [TenFeetLayoutComponent, TemplateProducerComponent],
      providers: [
        MockProvider(SettingsService, settingsService),
        MockProvider(IdleService, idleService),
        MockProvider(DialogService, {
          close: closeDialog,
        }),
      ],
    }).overrideComponent(TenFeetLayoutComponent, {
      remove: {
        imports: [ZoneSelectorComponent],
      },
      add: {
        imports: [MockComponent(ZoneSelectorComponent)],
      },
    });
    fixture = TestBed.createComponent(TemplateProducerComponent);
    fixture.componentRef.setInput("$layoutClass", $layoutClass);
    await fixture.whenStable();
    component = fixture.componentInstance.tenFeetLayoutComponent;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
