import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { Student, AttendanceRecord, LeaveRequest } from '../../../models/attendance.model';

@Component({
  selector: 'app-parent-portal',
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-portal.html',
  styleUrl: './parent-portal.css',
})
export class ParentPortal implements OnInit {
  // Search
  nisInput = '';
  student: Student | null = null;
  searchError = '';

  // Attendance History
  attendanceRecords: AttendanceRecord[] = [];
  selectedMonth = '';
  months: string[] = [];

  // Leave Request Form
  showLeaveForm = false;
  leaveType: 'izin' | 'sakit' = 'sakit';
  leaveReason = '';
  startDate = '';
  endDate = '';
  parentName = '';
  parentContact = '';
  submitMessage = '';
  submitMessageType: 'success' | 'error' | '' = '';

  // Leave Requests History
  leaveRequests: LeaveRequest[] = [];

  // Today's Status
  todayStatus: AttendanceRecord | null = null;

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit() {
    this.initializeMonths();
    this.selectedMonth = new Date().toISOString().substring(0, 7);
  }

  initializeMonths() {
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      this.months.push(month.toISOString().substring(0, 7));
    }
  }

  searchStudent() {
    this.searchError = '';
    this.student = null;
    this.attendanceRecords = [];
    this.leaveRequests = [];
    this.todayStatus = null;

    if (!this.nisInput.trim()) {
      this.searchError = 'Mohon masukkan NIS siswa';
      return;
    }

    const foundStudent = this.attendanceService.getStudentByNis(this.nisInput.trim());
    if (!foundStudent) {
      this.searchError = 'Siswa dengan NIS tersebut tidak ditemukan';
      return;
    }

    this.student = foundStudent;
    this.loadStudentData();
  }

  loadStudentData() {
    if (!this.student) return;

    // Load all attendance records
    const allRecords = this.attendanceService.getAttendanceByStudent(this.student.id);

    // Filter by selected month
    this.filterRecordsByMonth();

    // Get today's status
    const today = new Date().toISOString().split('T')[0];
    this.todayStatus = allRecords.find(r => r.date === today) || null;

    // Load leave requests
    this.leaveRequests = this.attendanceService.getLeaveRequestsByStudent(this.student.id);
  }

  filterRecordsByMonth() {
    if (!this.student) return;

    const allRecords = this.attendanceService.getAttendanceByStudent(this.student.id);
    this.attendanceRecords = allRecords.filter(r =>
      r.date.startsWith(this.selectedMonth)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  toggleLeaveForm() {
    this.showLeaveForm = !this.showLeaveForm;
    if (this.showLeaveForm) {
      this.resetLeaveForm();
    }
  }

  resetLeaveForm() {
    this.leaveType = 'sakit';
    this.leaveReason = '';
    this.startDate = new Date().toISOString().split('T')[0];
    this.endDate = new Date().toISOString().split('T')[0];
    this.parentName = '';
    this.parentContact = '';
    this.submitMessage = '';
    this.submitMessageType = '';
  }

  submitLeaveRequest() {
    if (!this.student) return;

    // Validation
    if (!this.leaveReason.trim()) {
      this.showSubmitMessage('Mohon isi alasan izin/sakit', 'error');
      return;
    }

    if (!this.startDate || !this.endDate) {
      this.showSubmitMessage('Mohon pilih tanggal mulai dan selesai', 'error');
      return;
    }

    if (new Date(this.endDate) < new Date(this.startDate)) {
      this.showSubmitMessage('Tanggal selesai harus setelah tanggal mulai', 'error');
      return;
    }

    if (!this.parentName.trim()) {
      this.showSubmitMessage('Mohon isi nama orang tua/wali', 'error');
      return;
    }

    if (!this.parentContact.trim()) {
      this.showSubmitMessage('Mohon isi nomor kontak', 'error');
      return;
    }

    try {
      const request = this.attendanceService.submitLeaveRequest({
        studentId: this.student.id,
        studentName: this.student.name,
        studentNis: this.student.nis,
        studentClass: this.student.class,
        leaveType: this.leaveType,
        reason: this.leaveReason.trim(),
        startDate: this.startDate,
        endDate: this.endDate,
        parentName: this.parentName.trim(),
        parentContact: this.parentContact.trim()
      });

      this.showSubmitMessage('Permohonan izin berhasil diajukan', 'success');
      this.showLeaveForm = false;
      this.loadStudentData();
    } catch (error) {
      this.showSubmitMessage('Terjadi kesalahan saat mengajukan izin', 'error');
    }
  }

  showSubmitMessage(message: string, type: 'success' | 'error') {
    this.submitMessage = message;
    this.submitMessageType = type;

    setTimeout(() => {
      this.submitMessage = '';
      this.submitMessageType = '';
    }, 5000);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('id-ID');
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'hadir': 'bg-green-100 text-green-800',
      'terlambat': 'bg-yellow-100 text-yellow-800',
      'izin': 'bg-purple-100 text-purple-800',
      'sakit': 'bg-orange-100 text-orange-800',
      'alpha': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getLeaveStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getAttendanceRate(): number {
    if (this.attendanceRecords.length === 0) return 0;
    const present = this.attendanceRecords.filter(
      r => r.status === 'hadir' || r.status === 'terlambat'
    ).length;
    return Math.round((present / this.attendanceRecords.length) * 100);
  }
}
