import 'jest-preset-angular/setup-jest';
import { ngMocks } from 'ng-mocks'; // eslint-disable-line import/order
import {nanoidMock } from "@mock/nanoid.mock";

// auto spy
ngMocks.autoSpy('jest');

import { CommonModule } from '@angular/common'; // eslint-disable-line import/order
import { ApplicationModule } from '@angular/core'; // eslint-disable-line import/order
import { BrowserModule } from '@angular/platform-browser'; // eslint-disable-line import/order
import { mockRoonWorker } from "@mock/worker.utils.mock";  // eslint-disable-line import/order

ngMocks.globalKeep(ApplicationModule, true);
ngMocks.globalKeep(CommonModule, true);
ngMocks.globalKeep(BrowserModule, true);

mockRoonWorker();
nanoidMock.mockImplementation(() => 1);

export {}
