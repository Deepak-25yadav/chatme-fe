import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          switch (error.status) {
            case 401:
              // Unauthorized - redirect to login
              errorMessage = 'Unauthorized. Please login again.';
              // Clear auth data directly to avoid circular dependency
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('currentUser');
              this.router.navigate(['/login']);
              break;
            case 403:
              errorMessage = 'Access forbidden';
              break;
            case 404:
              errorMessage = 'Resource not found';
              break;
            case 500:
              errorMessage = 'Internal server error';
              break;
            default:
              errorMessage = error.error?.error || error.error?.message || error.message;
          }
        }

        console.error('HTTP Error:', errorMessage);
        return throwError(() => ({ message: errorMessage, status: error.status }));
      })
    );
  }
}
