import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email:             string  = '';
  password:          string  = '';
  errorMessage:      string  = '';
  infoMessage:       string  = '';   // non-blocking info (no chat access)
  isLoading:         boolean = false;
  isPasswordVisible: boolean = false;
  isEmailVisible:    boolean = true;
  returnUrl:         string  = '/';

  togglePasswordVisibility(): void { this.isPasswordVisible = !this.isPasswordVisible; }
  toggleEmailVisibility():    void { this.isEmailVisible    = !this.isEmailVisible; }

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password';
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';
    this.infoMessage  = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;

        // ── Gate: only vip with chatAccess=true (or admin) can go to /chat ───
        if (this.authService.canAccessChat) {
          // Has full chat access → go to chat (or the originally requested url)
          const redirectUrl = this.returnUrl === '/' ? '/chat' : this.returnUrl;
          this.router.navigate([redirectUrl]);
        } else {
          // No chat access → go to music home
          // Show a gentle info message so user understands (not an error)
          this.infoMessage = 'Logged in! Chat access is not enabled for your account yet.';
          setTimeout(() => this.router.navigate(['/music']), 1800);
        }
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err?.error?.error || err.message || 'Login failed. Please try again.';
      }
    });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}
