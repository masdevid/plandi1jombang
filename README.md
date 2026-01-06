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
- **Backend**: Express.js API Server (Docker) + Vercel Serverless Functions
- **Database**: PostgreSQL 16 (Docker for local, Neon for Vercel)
- **Deployment**: Docker (local/production) + Vercel (serverless)
- **Package Manager**: pnpm

## 📦 Quick Start

### Option 1: Local Development with Docker (Recommended)

**Prerequisites:**
- Docker Desktop
- Node.js 20+
- pnpm 10+

**Get started in 3 commands:**

\`\`\`bash
# 1. Install API dependencies
pnpm api:install

# 2. Setup and test (automated)
pnpm setup

# 3. Start frontend
pnpm start
\`\`\`

Open http://localhost:4200 🎉

See [GETTING_STARTED.md](GETTING_STARTED.md) for detailed guide.

### Option 2: Vercel Deployment (Cloud)

**Prerequisites:**
- Vercel account
- PostgreSQL database (Neon recommended)

\`\`\`bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod

# Configure POSTGRES_URL in Vercel dashboard
# Settings → Environment Variables → Add POSTGRES_URL
\`\`\`

## 📖 Dokumentasi

### Getting Started
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Complete step-by-step setup guide
- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** - Comprehensive Docker documentation
- **[SETUP_SUMMARY.md](SETUP_SUMMARY.md)** - Quick reference summary

### Development Guides
- [Database Migration](docs/DATABASE_MIGRATION.md) - Panduan migrasi PostgreSQL
- [Admin System](docs/ADMIN_SYSTEM.md) - Admin authentication & authorization
- [Local Docker Setup](docs/LOCAL_DOCKER_SETUP.md) - Detailed local development guide
- [Testing Guide](tests/README.md) - Complete testing documentation

### Features & Updates
- [Security Enhancements](docs/SECURITY_ENHANCEMENTS.md) - Security best practices
- [Camera Scanner](docs/CAMERA_SCANNER_UPDATE.md) - QR code scanner implementation
- [Class Naming Convention](docs/CLASS_NAMING_UPDATE.md) - Sistem penamaan kelas K1-K6
- [Branding Guide](docs/BRANDING_UPDATE.md) - Logo dan skema warna
- [SEO Optimization](docs/SEO_UPDATE.md) - Optimasi SEO dan profil sekolah

## 🛠️ Development

\`\`\`bash
# Docker + API server
pnpm docker:up          # Start PostgreSQL + API
pnpm docker:down        # Stop services
pnpm docker:logs        # View logs
pnpm docker:restart     # Restart API

# Database
pnpm db:init            # Initialize database
pnpm db:migrate:columns # Add new columns
pnpm db:seed            # Seed with 161 students

# Testing
pnpm test:api           # Run API tests
pnpm test:quick         # Quick sanity check
pnpm setup              # Automated setup + test

# Frontend
pnpm start              # Development server (port 4200)
pnpm build              # Build for production
\`\`\`

## 📁 Struktur Proyek

\`\`\`
sd-plandi/
├── api/                      # Vercel Serverless Functions
│   ├── lib/                 # Database & utilities
│   ├── students.ts          # Student management API
│   ├── attendance.ts        # Attendance tracking API
│   ├── auth.ts              # Authentication API
│   ├── admin.ts             # Admin dashboard API
│   └── migrate.ts           # Database migration script
├── api-server/              # Docker Express API Server
│   ├── server.js            # Express server (10 endpoints)
│   └── package.json         # API dependencies
├── src/                     # Angular application
│   ├── app/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── guards/         # Route guards (auth)
│   │   ├── models/         # TypeScript interfaces
│   │   └── services/       # API services
│   └── index.html          # Main HTML with SEO
├── tests/                   # API test scripts
│   ├── test-api.js         # Comprehensive Node.js tests
│   ├── test-api.sh         # Bash test script
│   └── README.md           # Testing documentation
├── public/                 # Static assets
│   ├── icons/             # Logos & favicons
│   ├── sitemap.xml        # SEO sitemap
│   └── robots.txt         # Crawler instructions
├── docs/                   # Documentation
├── docker-compose.yml      # Docker configuration
├── Dockerfile.api          # API container build
└── .env.development        # Local environment
\`\`\`

## 🎨 Brand Guidelines

**Warna Utama**: Orange (#f97316)
**Logo**: Tersedia di \`/public/icons/\`
**Font**: Poppins (heading), Inter (body)

## 📱 API Endpoints (10 Total)

### Local Docker: `http://localhost:3001`
### Vercel: `https://plandi1jombang.vercel.app/api`

1. **GET /health** - Health check & database status
2. **POST/GET /auth** - Authentication (login/verify)
3. **GET /admin** - Admin dashboard (requires auth)
4. **GET /students** - 161 students from Excel
5. **GET/POST /attendance** - Attendance records & check-in
6. **GET/POST/PUT /leave-requests** - Leave management
7. **POST /db-init** - Database initialization
8. **POST /db-migrate-columns** - Schema migrations
9. **GET /intrakurikuler** - Subjects & class assignments
10. **GET /ekstrakurikuler** - Activities & members

Detail lengkap: [GETTING_STARTED.md](GETTING_STARTED.md)

## 🚀 Deployment

### Option 1: Local/Production with Docker (Recommended)

\`\`\`bash
# 1. Install API dependencies
pnpm api:install

# 2. Start Docker services (PostgreSQL + API)
pnpm docker:up

# 3. Initialize database
pnpm db:init
pnpm db:migrate:columns
pnpm db:seed

# 4. Start frontend
pnpm start

# Access at http://localhost:4200
# API at http://localhost:3001
\`\`\`

**Benefits:**
- ✅ Unlimited API endpoints (no Vercel limit)
- ✅ No cold starts
- ✅ Free (no monthly cost)
- ✅ Full data control

**Details:** See [DOCKER_SETUP.md](DOCKER_SETUP.md)

### Option 2: Vercel (Cloud Deploy)

\`\`\`bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
\`\`\`

**Environment Variables:**
1. Buka project di Vercel Dashboard
2. Settings → Environment Variables
3. Tambahkan \`POSTGRES_URL\` dari Neon

**Note:** Limited to 12 serverless functions on free tier.

## 📊 Database Schema

**Students**: id, nis, name, class (K1-K6), photo, qr_code, active
**Attendance**: id, student_id, check_in_time, date, status
**Leave Requests**: id, student_id, start_date, end_date, reason, status

Detail lengkap: [Database Migration](docs/DATABASE_MIGRATION.md)

## 🔒 Security

- ✅ SQL injection protection (parameterized queries)
- ✅ Password hashing with SHA-256 (never exposed to client)
- ✅ Token-based authentication (256-bit random tokens)
- ✅ Security headers (HSTS, X-Frame-Options, CSP, etc.)
- ✅ Session management with automatic expiry
- ✅ Role-based access control (Admin & Wali Kelas)
- ✅ CORS configured for production domain
- ✅ Environment variables for secrets
- ✅ Input validation and sanitization
- ✅ User-friendly error messages (no information disclosure)
- ✅ HTTPS enforcement via Strict-Transport-Security

**Details:** See [Security Enhancements](docs/SECURITY_ENHANCEMENTS.md)

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
