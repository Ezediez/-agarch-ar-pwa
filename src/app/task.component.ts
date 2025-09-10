import {
  input,
  output,
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import {
  MatCard,
  MatCardContent,
} from '@angular/material/card';
import { Task, TaskWithSubtasks } from './services/task.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RoundbuttonComponent } from './roundbutton.component';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatButtonToggleModule,
    MatIconModule,
    MatButtonModule,
    RoundbuttonComponent,
    MatDividerModule,
  ],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskComponent {
  task = input(undefined as TaskWithSubtasks | undefined);
  canDelete = input(true);
  showGeneratedWithGemini = input(false);

  deleteRequest = output<TaskWithSubtasks>();
  tasksCompletedToggle = output<Task[]>();

  onCheckedChanged(subtask: Task) {
    subtask.completed = !subtask.completed;
    this.tasksCompletedToggle.emit([subtask]);
  }

  onCheckedChangeMainTask(task?: TaskWithSubtasks) {
    if (task) {
      task.subtasks.forEach((subtask: Task) => {
        subtask.completed = !task.maintask.completed;
      });
      task.maintask.completed = !task.maintask.completed;
      this.tasksCompletedToggle.emit([task.maintask, ...task.subtasks]);
    }
  }

  onDeleteClicked() {
    const task = this.task();
    if (task) {
      this.deleteRequest.emit(task);
    }
  }
}
