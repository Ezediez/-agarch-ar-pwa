import {
  input,
  output,
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-roundbutton',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './roundbutton.component.html',
  styleUrl: './roundbutton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoundbuttonComponent {
  checked = input(false);
  title = input('');
  subtask = input(false);
  disabled = input(false);
  checkedChanged = output<boolean>();

  onClick() {
    this.checkedChanged.emit(!this.checked);
  }
}
