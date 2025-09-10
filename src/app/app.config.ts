import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { initializeApp, provideFirebaseApp, getApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environments';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { TaskViewComponent } from './task-view.component';
import { LoginComponent } from './login.component';
import { SignupComponent } from './signup.component';
import { PasswordResetComponent } from './password-reset.component';
import { AuthGuard } from './auth.guard';
import { getAI, provideAI } from '@angular/fire/ai';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'password-reset', component: PasswordResetComponent },
  { path: '', component: TaskViewComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' } // Redirect any other path to home
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAI(() => getAI(getApp())),
    provideAnimationsAsync(),
  ],
};
