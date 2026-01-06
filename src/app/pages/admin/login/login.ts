import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Email dan password harus diisi';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const result = await this.authService.login(this.email, this.password);

    this.loading = false;

    if (result.success) {
      // Get return URL or default to dashboard
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
      this.router.navigate([returnUrl]);
    } else {
      this.errorMessage = result.error || 'Login gagal';
    }
  }
}
