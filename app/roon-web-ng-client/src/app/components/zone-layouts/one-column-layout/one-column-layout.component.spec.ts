import { Component, Input, Signal, signal, ViewChild, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CompactLayoutComponent } from "@components/zone-layouts/compact-layout/compact-layout.component";
import { OneColumnLayoutComponent } from "./one-column-layout.component";

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
    <nr-one-column-layout
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
  imports: [OneColumnLayoutComponent],
})
class TemplateProducerComponent {
  @Input() $layoutClass!: Signal<string>;
  @ViewChild(OneColumnLayoutComponent) oneColumnLayout!: CompactLayoutComponent;
}

describe("OneColumnLayoutComponent", () => {
  let component: OneColumnLayoutComponent;
  let fixture: ComponentFixture<TemplateProducerComponent>;
  let $layoutClass: WritableSignal<string>;

  beforeEach(() => {
    $layoutClass = signal("layout-class");
    fixture = TestBed.createComponent(TemplateProducerComponent);
    fixture.componentRef.setInput("$layoutClass", $layoutClass);
    fixture.detectChanges();
    component = fixture.componentInstance.oneColumnLayout;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
