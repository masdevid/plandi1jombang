export interface Student {
  id: string;
  nis: string;
  name: string;
  class: string;
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
  notes?: string;
}

export interface AttendanceDatabase {
  students: Student[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  lastUpdated: string;
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

// Utility function to get full class name
export function getClassDisplayName(classCode: string): string {
  const classMap: Record<string, string> = {
    'K1': 'Kelas 1',
    'K2': 'Kelas 2',
    'K3': 'Kelas 3',
    'K4': 'Kelas 4',
    'K5': 'Kelas 5',
    'K6': 'Kelas 6'
  };
  return classMap[classCode] || classCode;
}
