import { ngMocks } from "ng-mocks";
import { CommonModule } from "@angular/common";
import { ApplicationModule } from "@angular/core";
import { getTestBed } from "@angular/core/testing";
import { BrowserModule } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

ngMocks.globalKeep(ApplicationModule, true);
ngMocks.globalKeep(CommonModule, true);
ngMocks.globalKeep(BrowserModule, true);

getTestBed().configureTestingModule({
  imports: [ApplicationModule, CommonModule, NoopAnimationsModule],
});
