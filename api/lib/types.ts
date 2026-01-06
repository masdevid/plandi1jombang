export interface Student {
  id: string;
  nis: string;
  name: string;
  class: string;
  gender?: string;
  dateOfBirth?: string;
  religion?: string;
  photo?: string;
  qrCode: string;
  active: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  status: 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alpha';
  scannedBy?: string;  // User ID who scanned the attendance
  scannerName?: string; // Name of the user who scanned
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  leaveType: 'izin' | 'sakit';
  reason: string;
  startDate: string;
  endDate: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  parentName?: string;
  parentContact?: string;
  attachmentUrl?: string;
}

export interface AttendanceStats {
  totalStudents: number;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpha: number;
  belumAbsen: number;
}
