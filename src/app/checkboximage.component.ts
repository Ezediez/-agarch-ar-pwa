import {
  input,
  output,
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-checkboximage',
  standalone: true,
  imports: [MatIconModule, MatCardModule],
  templateUrl: './checkboximage.component.html',
  styleUrl: './checkboximage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboximageComponent {
  checked = input(false);
  src = input('');
  checkedChanged = output<boolean>();

  onClick() {
    this.checkedChanged.emit(!this.checked);
  }

  async getFile() {
    const fetchImage = await fetch(this.src());
    const blob = await fetchImage.blob();
    return new File([blob], 'dot.png', blob);
  }
}
