import { timer } from "rxjs";
import { AfterViewInit, ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "nr-extension-not-enabled",
  standalone: true,
  imports: [],
  templateUrl: "./extension-not-enabled.component.html",
  styleUrl: "./extension-not-enabled.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtensionNotEnabledComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const timerSubscription = timer(10000).subscribe(() => {
      timerSubscription.unsubscribe();
      window.location.reload();
    });
  }
}
