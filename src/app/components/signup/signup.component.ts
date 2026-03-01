import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  name:            string  = '';
  email:           string  = '';
  password:        string  = '';
  confirmPassword: string  = '';
  role: 'admin' | 'user'  = 'user';
  errorMessage:    string  = '';
  successMessage:  string  = '';
  isLoading:       boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    // ── Validation ────────────────────────────────────────────────────────────
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    this.isLoading      = true;
    this.errorMessage   = '';
    this.successMessage = '';

    this.authService.signup(this.name, this.email, this.password, this.role).subscribe({
      next: () => {
        this.isLoading      = false;
        this.successMessage = 'Account created! Taking you home…';
        // ── After signup → always go to music home, NOT chat ─────────────────
        setTimeout(() => this.router.navigate(['/music']), 1200);
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err?.error?.error || err.message || 'Signup failed. Please try again.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
