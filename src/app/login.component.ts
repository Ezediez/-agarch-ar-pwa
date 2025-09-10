import { Component, inject } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
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
      <h2 class="text-2xl font-bold mb-4">Login</h2>
      <div class="w-full max-w-md">
        <mat-form-field class="w-full">
          <mat-label>Email</mat-label>
          <input matInput [formControl]="email" placeholder="Enter your email">
        </mat-form-field>
        <mat-form-field class="w-full">
          <mat-label>Password</mat-label>
          <input matInput [formControl]="password" type="password" placeholder="Enter your password">
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="signIn()" [disabled]="email.invalid || password.invalid">Login</button>
        <div class="mt-4 text-center">
          <a routerLink="/signup">Don't have an account? Sign up</a>
          <span class="mx-2">|</span>
          <a routerLink="/password-reset">Forgot password?</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private taskService = inject(TaskService);
  private router = inject(Router);

  email = new FormControl('', [Validators.required, Validators.email]);
  password = new FormControl('', [Validators.required]);

  async signIn() {
    if (this.email.valid && this.password.valid && this.email.value && this.password.value) {
      try {
        await this.taskService.signIn(this.email.value, this.password.value);
        this.router.navigate(['/']); // Navigate to home on successful login
      } catch (error) {
        this.taskService.handleError(error, 'Invalid login credentials.');
      }
    }
  }
}
