import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TaskService } from './services/task.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private taskService = inject(TaskService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.taskService.user$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true; // If user is logged in, allow access
        }
        // If user is not logged in, redirect to login page
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
}
