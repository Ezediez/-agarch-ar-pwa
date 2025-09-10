import { Component, inject } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="flex flex-col items-center justify-center p-8">
      <h2 class="text-2xl font-bold mb-4">Reset Your Password</h2>
      <div *ngIf="!emailSent; else emailSentMessage" class="w-full max-w-md">
        <mat-form-field class="w-full">
          <mat-label>Email</mat-label>
          <input matInput [formControl]="email" placeholder="Enter your email">
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="sendPasswordResetEmail()" [disabled]="email.invalid">Send Reset Link</button>
      </div>
      <ng-template #emailSentMessage>
        <p>An email has been sent to {{ email.value }} with instructions to reset your password.</p>
      </ng-template>
    </div>
  `
})
export class PasswordResetComponent {
  private taskService = inject(TaskService);

  email = new FormControl('', [Validators.required, Validators.email]);
  emailSent = false;

  async sendPasswordResetEmail() {
    if (this.email.valid && this.email.value) {
      try {
        await this.taskService.sendPasswordReset(this.email.value);
        this.emailSent = true;
      } catch (error) {
        this.taskService.handleError(error, 'Failed to send password reset email.');
      }
    }
  }
}
