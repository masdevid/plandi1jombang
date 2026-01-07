import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  email = '';
  password = '';
  loading = false;
  hidePassword = true;

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  ngOnInit() {
    // Redirect if already logged in (use setTimeout to avoid change detection issues)
    if (this.authService.isAuthenticated()) {
      setTimeout(() => {
        this.router.navigate(['/admin/dashboard']);
      });
    }
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.notificationService.warning('Email dan password harus diisi');
      return;
    }

    this.loading = true;

    const result = await this.authService.login(this.email, this.password);

    this.loading = false;

    if (result.success) {
      this.notificationService.success('Login berhasil! Selamat datang.');

      // Get return URL or default to dashboard
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
      this.router.navigate([returnUrl]);
    } else {
      this.notificationService.error(result.error || 'Login gagal');
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}
