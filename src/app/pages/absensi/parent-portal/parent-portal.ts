import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AttendanceService } from '../../../services/attendance.service';
import { Student, AttendanceRecord, LeaveRequest } from '../../../models/attendance.model';

@Component({
  selector: 'app-parent-portal',
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-portal.html',
  styleUrl: './parent-portal.css',
})
export class ParentPortal implements OnInit, OnDestroy {
  // Search
  searchInput = '';
  searchResults: Student[] = [];
  student: Student | null = null;
  searchError = '';
  isSearching = false;
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

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

  async ngOnInit() {
    this.initializeMonths();
    this.selectedMonth = new Date().toISOString().substring(0, 7);

    // Load students from API
    await this.attendanceService.loadStudents();

    // Setup debounced search
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  initializeMonths() {
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      this.months.push(month.toISOString().substring(0, 7));
    }
  }

  onSearchInput() {
    this.searchSubject.next(this.searchInput);
  }

  performSearch(searchTerm: string) {
    this.searchError = '';
    this.searchResults = [];
    this.isSearching = false;

    if (!searchTerm.trim()) {
      return;
    }

    this.isSearching = true;

    const allStudents = this.attendanceService.getStudents();
    const term = searchTerm.trim().toLowerCase();

    // Search by NIS or name
    this.searchResults = allStudents.filter(s =>
      s.active && (
        s.nis.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term)
      )
    ).slice(0, 10); // Limit to 10 results

    this.isSearching = false;

    if (this.searchResults.length === 0) {
      this.searchError = 'Tidak ada siswa yang ditemukan';
    }
  }

  selectStudent(student: Student) {
    this.student = student;
    this.searchInput = `${student.nis} - ${student.name}`;
    this.searchResults = [];
    this.searchError = '';
    this.loadStudentData();
  }

  clearSearch() {
    this.searchInput = '';
    this.searchResults = [];
    this.student = null;
    this.attendanceRecords = [];
    this.leaveRequests = [];
    this.todayStatus = null;
    this.searchError = '';
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
