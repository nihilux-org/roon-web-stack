import { timer } from "rxjs";
import { AfterViewInit, Component } from "@angular/core";

@Component({
  selector: "nr-extension-not-enabled",
  imports: [],
  templateUrl: "./extension-not-enabled.component.html",
  styleUrl: "./extension-not-enabled.component.scss",
})
export class ExtensionNotEnabledComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const timerSubscription = timer(10000).subscribe(() => {
      timerSubscription.unsubscribe();
      window.location.reload();
    });
  }
}
