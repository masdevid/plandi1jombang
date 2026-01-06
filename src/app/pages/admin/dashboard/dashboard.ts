import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { getClassDisplayName } from '../../../models/attendance.model';

interface DashboardStats {
  attendance: {
    total: number;
    hadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    alpha: number;
  };
  totalStudents: number;
  pendingLeaveRequests: number;
  userRole: string;
  assignedClass: string | null;
}

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  checkInTime: string;
  status: string;
}

interface LeaveRequest {
  id: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  user: User | null = null;
  stats: DashboardStats | null = null;
  recentAttendance: AttendanceRecord[] = [];
  pendingLeaveRequests: LeaveRequest[] = [];
  loading = true;
  errorMessage = '';
  today = new Date().toISOString().split('T')[0];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/admin/login']);
      return;
    }

    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading = true;
    this.errorMessage = '';

    try {
      const headers = this.authService.getAuthHeaders();

      // Load dashboard stats
      const statsResponse = await fetch(`/api/admin?resource=dashboard`, {
        headers
      });

      if (statsResponse.status === 401 || statsResponse.status === 403) {
        // Session expired or unauthorized
        await this.authService.logout();
        this.router.navigate(['/admin/login']);
        return;
      }

      if (statsResponse.ok) {
        this.stats = await statsResponse.json();
      } else {
        this.errorMessage = 'Gagal memuat statistik dashboard';
      }

      // Load recent attendance
      const attendanceResponse = await fetch(`/api/admin?resource=attendance&date=${this.today}`, {
        headers
      });

      if (attendanceResponse.ok) {
        const allAttendance = await attendanceResponse.json();
        this.recentAttendance = allAttendance.slice(0, 10);
      }

      // Load pending leave requests
      const leaveResponse = await fetch(`/api/admin?resource=leave-requests&status=pending`, {
        headers
      });

      if (leaveResponse.ok) {
        this.pendingLeaveRequests = await leaveResponse.json();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.errorMessage = 'Koneksi ke server gagal, periksa internet Anda';
    } finally {
      this.loading = false;
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  getClassDisplayName(classCode: string | null | undefined): string {
    if (!classCode) return "";
    return getClassDisplayName(classCode);
  }

  getAttendancePercentage(): number {
    if (!this.stats || this.stats.totalStudents === 0) return 0;
    const present = (this.stats.attendance.hadir || 0) + (this.stats.attendance.terlambat || 0);
    return Math.round((present / this.stats.totalStudents) * 100);
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  async approveLeaveRequest(id: string) {
    const confirmed = confirm('Setujui pengajuan izin ini?');
    if (!confirmed) return;

    try {
      const headers = {
        ...this.authService.getAuthHeaders(),
        'Content-Type': 'application/json'
      };

      const response = await fetch(`/api/admin?resource=leave-requests`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, status: 'approved' })
      });

      if (response.status === 401 || response.status === 403) {
        await this.authService.logout();
        this.router.navigate(['/admin/login']);
        return;
      }

      if (response.ok) {
        await this.loadDashboardData();
        alert('Pengajuan izin telah disetujui');
      } else if (response.status === 403) {
        alert('Anda tidak memiliki akses untuk menyetujui pengajuan ini');
      } else {
        alert('Gagal menyetujui pengajuan izin');
      }
    } catch (error) {
      console.error('Error approving leave request:', error);
      alert('Koneksi ke server gagal');
    }
  }

  async rejectLeaveRequest(id: string) {
    const confirmed = confirm('Tolak pengajuan izin ini?');
    if (!confirmed) return;

    try {
      const headers = {
        ...this.authService.getAuthHeaders(),
        'Content-Type': 'application/json'
      };

      const response = await fetch(`/api/admin?resource=leave-requests`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, status: 'rejected' })
      });

      if (response.status === 401 || response.status === 403) {
        await this.authService.logout();
        this.router.navigate(['/admin/login']);
        return;
      }

      if (response.ok) {
        await this.loadDashboardData();
        alert('Pengajuan izin telah ditolak');
      } else if (response.status === 403) {
        alert('Anda tidak memiliki akses untuk menolak pengajuan ini');
      } else {
        alert('Gagal menolak pengajuan izin');
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      alert('Koneksi ke server gagal');
    }
  }
}
