import { nanoidMock } from "@mock/nanoid.mock";
// ngMocks.autoSpy("default");
import { mockRoonWorker } from "@mock/worker.utils.mock";

import "@analogjs/vitest-angular/setup-snapshots";
import { ngMocks } from "ng-mocks";
import { CommonModule } from "@angular/common";
import { ApplicationModule, NgModule, provideZonelessChangeDetection } from "@angular/core";
import { getTestBed } from "@angular/core/testing";
import { BrowserModule } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserTestingModule, platformBrowserTesting } from "@angular/platform-browser/testing";

@NgModule({
  providers: [provideZonelessChangeDetection()],
})
export class TestModule {}

getTestBed().initTestEnvironment([BrowserTestingModule, TestModule], platformBrowserTesting());

ngMocks.globalKeep(ApplicationModule, true);
ngMocks.globalKeep(CommonModule, true);
ngMocks.globalKeep(BrowserModule, true);

getTestBed().configureTestingModule({
  imports: [ApplicationModule, CommonModule, NoopAnimationsModule],
});

mockRoonWorker();
nanoidMock.mockImplementation(() => 1);

export {};
