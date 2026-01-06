import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { AttendanceService } from '../../../services/attendance.service';
import { AuthService } from '../../../services/auth.service';
import { AttendanceRecord, AttendanceStats } from '../../../models/attendance.model';

@Component({
  selector: 'app-check-in',
  imports: [CommonModule, FormsModule, RouterLink, ZXingScannerModule],
  templateUrl: './check-in.html',
  styleUrl: './check-in.css',
})
export class CheckIn implements OnInit {
  qrCodeInput = '';
  lastCheckIn: AttendanceRecord | null = null;
  stats: AttendanceStats | null = null;
  message = '';
  messageType: 'success' | 'error' | '' = '';
  todayDate = '';
  currentTime = '';

  // Camera scanner properties
  showScanner = true;
  showManualInput = false;
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;
  hasDevices = false;
  hasPermission = false;
  allowedFormats = [BarcodeFormat.QR_CODE];

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verify authentication
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/admin/login']);
      return;
    }

    this.updateDateTime();
    this.loadStats();
    setInterval(() => this.updateDateTime(), 1000);
  }

  updateDateTime() {
    const now = new Date();
    this.todayDate = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.currentTime = now.toLocaleTimeString('id-ID');
  }

  loadStats() {
    const today = new Date().toISOString().split('T')[0];
    this.stats = this.attendanceService.getAttendanceStats(today);
  }

  // Camera scanner methods
  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);

    // Select back camera if available
    const backCamera = devices.find(device => 
      /back|rear|environment/i.test(device.label)
    );
    this.currentDevice = backCamera || devices[0];
  }

  onCodeResult(resultString: string): void {
    if (resultString) {
      this.qrCodeInput = resultString;
      this.processCheckIn();
    }
  }

  onHasPermission(has: boolean): void {
    this.hasPermission = has;
  }

  onDeviceChange(device: MediaDeviceInfo): void {
    this.currentDevice = device;
  }

  toggleManualInput(): void {
    this.showManualInput = !this.showManualInput;
    this.showScanner = !this.showManualInput;
    
    if (this.showManualInput) {
      // Focus on input after a short delay to ensure it's visible
      setTimeout(() => {
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    }
  }

  async processCheckIn() {
    if (!this.qrCodeInput.trim()) {
      this.showMessage('Mohon scan atau masukkan kode QR', 'error');
      return;
    }

    // Get current user for scanner tracking
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.showMessage('Sesi Anda telah berakhir, silakan login kembali', 'error');
      this.router.navigate(['/admin/login']);
      return;
    }

    const result = this.attendanceService.checkIn(
      this.qrCodeInput.trim(),
      user.id,
      user.name
    );

    if (result) {
      this.lastCheckIn = result;
      const status = result.status === 'hadir' ? 'tepat waktu' : result.status;
      this.showMessage(`Check-in berhasil! Status: ${status}`, 'success');
      this.loadStats();
      this.qrCodeInput = '';

      // Play success sound
      this.playSound('success');
    } else {
      this.showMessage('QR Code tidak valid atau siswa tidak ditemukan', 'error');
      this.playSound('error');
    }
  }

  showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;

    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 5000);
  }

  playSound(type: 'success' | 'error') {
    // Create simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = type === 'success' ? 800 : 400;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  get attendancePercentage(): number {
    if (!this.stats || this.stats.totalStudents === 0) return 0;
    const present = this.stats.hadir + this.stats.terlambat;
    return Math.round((present / this.stats.totalStudents) * 100);
  }
}
