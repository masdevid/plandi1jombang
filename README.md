# SDN Plandi 1 Jombang - Website Resmi

Website resmi SDN Plandi 1 Jombang dengan sistem absensi digital dan manajemen siswa.

## 🏫 Tentang

**SDN Plandi 1 Jombang** adalah Sekolah Dasar Negeri yang berkomitmen membangun generasi cerdas, berakhlak mulia, dan berprestasi melalui pendidikan berkualitas yang menyenangkan dan inovatif.

**Alamat**: Jl. Sumatra No. 22, Kec. Jombang, Kab. Jombang, Jawa Timur 61419
**Telepon**: (0321) 851655
**Email**: info@sdnplandi1jombang.sch.id
**Website**: https://sdnplandi1jombang.sch.id

## ✨ Fitur

- 🏠 **Website Profil Sekolah** - Informasi lengkap tentang sekolah
- 📱 **Absensi Digital** - Sistem absensi berbasis QR Code
- 👨‍🎓 **Manajemen Siswa** - Database siswa dengan foto dan QR code
- 📊 **Laporan Kehadiran** - Dashboard dan laporan kehadiran real-time
- 👪 **Portal Orang Tua** - Akses untuk orang tua memantau kehadiran anak
- 📅 **Pengajuan Izin** - Sistem pengajuan izin/sakit online

## 🚀 Teknologi

- **Frontend**: Angular 21 (Standalone Components)
- **Styling**: Tailwind CSS 3.4
- **Backend**: Vercel Serverless Functions
- **Database**: PostgreSQL (Neon)
- **Deployment**: Vercel
- **Package Manager**: pnpm

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database (Neon recommended)

### Installation

\`\`\`bash
# Clone repository
git clone <repository-url>
cd sd-plandi

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env and add your POSTGRES_URL

# Initialize database
pnpm db:migrate

# Start development server
pnpm start
\`\`\`

### Environment Variables

\`\`\`env
POSTGRES_URL=postgres://username:password@host/database
\`\`\`

## 📖 Dokumentasi

- [Database Migration](docs/DATABASE_MIGRATION.md) - Panduan migrasi PostgreSQL
- [Quick Start Guide](docs/QUICK_START.md) - Panduan cepat API dan development
- [Class Naming Convention](docs/CLASS_NAMING_UPDATE.md) - Sistem penamaan kelas K1-K6
- [Branding Guide](docs/BRANDING_UPDATE.md) - Logo dan skema warna
- [SEO Optimization](docs/SEO_UPDATE.md) - Optimasi SEO dan profil sekolah

## 🛠️ Development

\`\`\`bash
# Development server (port 4200)
pnpm start

# Build production
pnpm build

# Run database migration
pnpm db:migrate

# Lint & format
pnpm lint
\`\`\`

## 📁 Struktur Proyek

\`\`\`
sd-plandi/
├── api/                    # Vercel Serverless Functions
│   ├── lib/               # Database & utilities
│   ├── students.ts        # Student management API
│   ├── attendance.ts      # Attendance tracking API
│   ├── leave-requests.ts  # Leave request API
│   └── migrate.ts         # Database migration script
├── src/                   # Angular application
│   ├── app/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── models/       # TypeScript interfaces
│   │   └── services/     # API services
│   └── index.html        # Main HTML with SEO
├── public/               # Static assets
│   ├── icons/           # Logos & favicons
│   ├── sitemap.xml      # SEO sitemap
│   └── robots.txt       # Crawler instructions
└── docs/                # Documentation
\`\`\`

## 🎨 Brand Guidelines

**Warna Utama**: Orange (#f97316)
**Logo**: Tersedia di \`/public/icons/\`
**Font**: Poppins (heading), Inter (body)

## 📱 API Endpoints

### Students
- \`GET /api/students\` - List semua siswa
- \`GET /api/students?id={id}\` - Detail siswa
- \`POST /api/students\` - Tambah siswa baru
- \`PUT /api/students\` - Update siswa
- \`DELETE /api/students?id={id}\` - Hapus siswa

### Attendance
- \`GET /api/attendance\` - List kehadiran
- \`POST /api/attendance\` - Check-in dengan QR code
- \`GET /api/attendance/stats\` - Statistik kehadiran

### Leave Requests
- \`GET /api/leave-requests\` - List pengajuan izin
- \`POST /api/leave-requests\` - Submit izin baru
- \`PUT /api/leave-requests\` - Update status izin

Detail lengkap: [Quick Start Guide](docs/QUICK_START.md)

## 🚀 Deployment

### Vercel

\`\`\`bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
\`\`\`

### Environment Variables (Vercel)

1. Buka project di Vercel Dashboard
2. Settings → Environment Variables
3. Tambahkan \`POSTGRES_URL\` dari Neon

## 📊 Database Schema

**Students**: id, nis, name, class (K1-K6), photo, qr_code, active
**Attendance**: id, student_id, check_in_time, date, status
**Leave Requests**: id, student_id, start_date, end_date, reason, status

Detail lengkap: [Database Migration](docs/DATABASE_MIGRATION.md)

## 🔒 Security

- ✅ SQL injection protection (parameterized queries)
- ✅ CORS configured for production domain
- ✅ Environment variables for secrets
- ✅ Input validation on all endpoints
- ✅ Active students only in public queries

## 🤝 Contributing

1. Fork the project
2. Create feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit changes (\`git commit -m 'feat: add amazing feature'\`)
4. Push to branch (\`git push origin feature/AmazingFeature\`)
5. Open Pull Request

## 📄 License

Copyright © 2026 SDN Plandi 1 Jombang. All rights reserved.

## 👥 Team

Developed with ❤️ for SDN Plandi 1 Jombang

## 📞 Support

Untuk pertanyaan atau bantuan:
- Email: info@sdnplandi1jombang.sch.id
- Phone: (0321) 851655
- Website: https://sdnplandi1jombang.sch.id

---

**SDN Plandi 1 Jombang** - Membangun Generasi Cerdas dan Berakhlak Mulia
