import { Component, inject } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressSpinnerModule, // Import for the loading spinner
  ],
  template: `
    <div class="flex flex-col items-center justify-center p-8">
      <div class="w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4 text-center">Create Your Account</h2>

        <!-- Step 1: Form Input -->
        <div *ngIf="uiState === 'form'">
          <p class="text-center text-gray-600 mb-4">First, let's validate your identity with a one-time $1 USD transaction. This helps us prevent spam and fake accounts.</p>
          <mat-form-field class="w-full">
            <mat-label>Email</mat-label>
            <input matInput [formControl]="email" placeholder="Enter your email">
          </mat-form-field>
          <mat-form-field class="w-full">
            <mat-label>Password</mat-label>
            <input matInput [formControl]="password" type="password" placeholder="Choose a password (min. 6 characters)">
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="processValidationAndSignUp()" [disabled]="email.invalid || password.invalid" class="w-full">Validate and Sign Up</button>
          <div class="mt-4 text-center">
            <a routerLink="/login">Already have an account? Log in</a>
          </div>
        </div>

        <!-- Step 2: Processing -->
        <div *ngIf="uiState === 'processing'" class="flex flex-col items-center">
          <mat-spinner></mat-spinner>
          <p class="mt-4">Processing your validation... Do not refresh.</p>
        </div>

        <!-- Step 3: Success -->
        <div *ngIf="uiState === 'success'" class="text-center">
          <h3 class="text-xl font-bold text-green-600">Validation Successful!</h3>
          <p>Your account has been created. You are now being redirected to the main application...</p>
        </div>

      </div>
    </div>
  `
})
export class SignupComponent {
  private taskService = inject(TaskService);
  private router = inject(Router);

  email = new FormControl('', [Validators.required, Validators.email]);
  password = new FormControl('', [Validators.required, Validators.minLength(6)]);

  // UI state management: 'form', 'processing', 'success'
  uiState: 'form' | 'processing' | 'success' = 'form';

  async processValidationAndSignUp() {
    if (!this.email.valid || !this.password.valid || !this.email.value || !this.password.value) {
      return;
    }

    this.uiState = 'processing';

    try {
      // 1. Simulate the PayPal validation process
      const transactionId = await this.simulateValidationProcess();

      // 2. If validation is successful, create the user account
      const userCredential = await this.taskService.signUp(this.email.value, this.password.value);
      const userId = userCredential.user.uid;

      // 3. Save the validation details to Firestore
      await this.taskService.saveValidationDetails(userId, transactionId);

      // 4. Update UI to show success and navigate
      this.uiState = 'success';
      setTimeout(() => this.router.navigate(['/']), 3000); // Navigate to home after a short delay

    } catch (error) {
      this.taskService.handleError(error, 'Account creation failed. Please try again.');
      this.uiState = 'form'; // Reset UI on failure
    }
  }

  private simulateValidationProcess(): Promise<string> {
    return new Promise(resolve => {
      // Simulate an API call delay
      setTimeout(() => {
        const uniqueId = `VALIDATION-${uuidv4()}`;
        console.log(`Simulated validation success with Transaction ID: ${uniqueId}`);
        resolve(uniqueId);
      }, 2000);
    });
  }
}
