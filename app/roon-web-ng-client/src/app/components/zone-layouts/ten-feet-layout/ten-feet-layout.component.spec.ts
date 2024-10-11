import { MockBuilder, MockedComponentFixture, MockRender, ngMocks } from "ng-mocks";
import { Component, TemplateRef } from "@angular/core";
import { LayoutContext, LayoutData } from "@model/client";
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
  `,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix,@typescript-eslint/no-extraneous-class
class TemplateProducer {}

describe("TenFeetLayoutComponent", () => {
  let component: TenFeetLayoutComponent;
  let fixture: MockedComponentFixture<TenFeetLayoutComponent, { layout: LayoutData }>;
  let layout: LayoutData;
  let zoneActions: TemplateRef<LayoutContext>;
  let zoneCommands: TemplateRef<LayoutContext>;
  let zoneCurrentTrack: TemplateRef<LayoutContext>;
  let zoneImage: TemplateRef<LayoutContext>;
  let zoneProgression: TemplateRef<LayoutContext>;
  let zoneQueue: TemplateRef<LayoutContext>;
  let zoneVolume: TemplateRef<LayoutContext>;
  let layoutContext: LayoutContext;

  beforeEach(async () => {
    await MockBuilder(TemplateProducer, TenFeetLayoutComponent);
    const templateProducerFixture = MockRender(TemplateProducer);
    zoneActions = ngMocks.findTemplateRef(templateProducerFixture.debugElement, "zoneActions");
    zoneCommands = ngMocks.findTemplateRef(templateProducerFixture.debugElement, "zoneCommands");
    zoneCurrentTrack = ngMocks.findTemplateRef(templateProducerFixture.debugElement, "zoneCurrentTrack");
    zoneImage = ngMocks.findTemplateRef(templateProducerFixture.debugElement, "zoneImage");
    zoneProgression = ngMocks.findTemplateRef(templateProducerFixture.debugElement, "zoneProgression");
    zoneQueue = ngMocks.findTemplateRef(templateProducerFixture.debugElement, "zoneQueue");
    zoneVolume = ngMocks.findTemplateRef(templateProducerFixture.debugElement, "zoneVolume");
    layoutContext = {
      class: "ten-feet",
    };
    layout = {
      zoneActions,
      zoneCommands,
      zoneCurrentTrack,
      zoneImage,
      zoneProgression,
      zoneQueue,
      zoneVolume,
      context: layoutContext,
    };

    fixture = MockRender(
      TenFeetLayoutComponent,
      {
        layout,
      },
      {
        reset: true,
      }
    );
    component = fixture.componentInstance as unknown as TenFeetLayoutComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
