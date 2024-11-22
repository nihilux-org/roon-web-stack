import { ChangeDetectionStrategy, Component, EventEmitter, Output } from "@angular/core";

@Component({
  selector: "nr-alphabetical-index",
  imports: [],
  templateUrl: "./alphabetical-index.component.html",
  styleUrl: "./alphabetical-index.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlphabeticalIndexComponent {
  @Output() clickedLetter = new EventEmitter<string>();
  readonly alphabet: string[];
  constructor() {
    this.alphabet = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];
  }

  onLetterClicked(letter: string): void {
    this.clickedLetter.emit(letter);
  }
}
