# Quick Start Guide - SD Plandi Attendance System

## 🚀 Deploy & Setup

### 1. Deploy to Vercel (Already deployed: https://plandi1jombang.vercel.app)

```bash
# If redeploying
vercel --prod
```

### 2. Initialize Database with 161 Students

**IMPORTANT**: Run this to load all 161 students from Excel:

```bash
curl -X POST "https://plandi1jombang.vercel.app/api/db-init?force=true"
```

Expected response:
```json
{
  "success": true,
  "message": "Database force re-seeded successfully",
  "timestamp": "2026-01-07T..."
}
```

### 3. Verify Setup

```bash
# Check student count (should be 161)
curl -s "https://plandi1jombang.vercel.app/api/students" | jq 'length'

# Check first student (should have Excel data)
curl -s "https://plandi1jombang.vercel.app/api/students" | jq '.[0]'
```

## 📱 Access Points

### Public Pages
- **Home**: https://plandi1jombang.vercel.app
- **Parent Portal**: https://plandi1jombang.vercel.app/portal-orangtua

### Admin Pages (Auth Required)
- **Login**: https://plandi1jombang.vercel.app/admin/login
- **Dashboard**: https://plandi1jombang.vercel.app/admin/dashboard
- **Check-In**: https://plandi1jombang.vercel.app/admin/check-in
- **Reports**: https://plandi1jombang.vercel.app/admin/laporan
- **Students**: https://plandi1jombang.vercel.app/admin/siswa

## 🔐 Default Login Credentials

### Administrator
- **Email**: `admin@sdnplandi1jombang.sch.id`
- **Password**: `admin123`
- **Access**: All classes, full permissions

### Wali Kelas (Class Teachers)
| Class | Email | Password |
|-------|-------|----------|
| K1 | siti.aminah@sdnplandi1jombang.sch.id | wali123 |
| K2 | ahmad.fauzi@sdnplandi1jombang.sch.id | wali123 |
| K3 | nur.hidayah@sdnplandi1jombang.sch.id | wali123 |
| K4 | eko.prasetyo@sdnplandi1jombang.sch.id | wali123 |
| K5 | rina.kartika@sdnplandi1jombang.sch.id | wali123 |
| K6 | doni.prasetya@sdnplandi1jombang.sch.id | wali123 |

**⚠️ Change passwords after first login!**

## 🎯 Quick Tasks

### As Admin

1. **Login**: https://plandi1jombang.vercel.app/admin/login
2. **View Dashboard**: See all classes statistics
3. **Check-In Students**: Use camera scanner or manual input
4. **Review Leave Requests**: Approve or reject
5. **View Reports**: Daily, weekly, monthly attendance
6. **Manage Students**: View, add, edit student data

### As Parent

1. **Open Portal**: https://plandi1jombang.vercel.app/portal-orangtua
2. **Search Student**: Type NIS or name (e.g., "ADELIA" or "3182391263")
3. **View Attendance**: See check-in history and statistics
4. **Submit Leave**: Request izin/sakit with reason

### As Wali Kelas

1. **Login**: Use wali kelas credentials
2. **View Dashboard**: See only assigned class
3. **Check-In**: Scan student QR codes
4. **Review Requests**: Approve class leave requests
5. **Track Attendance**: Monitor class statistics

## 🛠️ Development

### Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm start

# Build for production
pnpm build

# Run database migration
pnpm db:migrate
```

### Docker Deployment

```bash
# Build and run
pnpm docker:build
pnpm docker:run

# Initialize database
curl -X POST "http://localhost:3000/api/db-init?force=true"

# View logs
pnpm docker:logs

# Stop
pnpm docker:stop
```

## 📊 Key Features

### ✅ Completed Features

1. **Scanner Tracking** - Records who performed each check-in
2. **Real-Time Search** - Parent portal with debounced search
3. **Route Protection** - Admin pages require authentication
4. **Role-Based Access** - Admin vs Wali Kelas permissions
5. **Excel Import** - 161 students from Excel file
6. **Camera Scanner** - QR code scanning with camera
7. **API Integration** - Frontend fetches from backend API

### 📋 Student Data

- **Total Students**: 161 (from Excel file)
- **Classes**: K1 (26), K2 (32), K3 (25), K4 (25), K5 (22), K6 (31)
- **Fields**: NIS, Name, Class, Gender, Date of Birth, Religion
- **QR Codes**: Unique for each student

## 🔧 Troubleshooting

### Parent Portal Shows Old Data

```bash
# Force re-seed database
curl -X POST "https://plandi1jombang.vercel.app/api/db-init?force=true"

# Clear browser cache
# Hard reload: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
```

### Login Not Working

1. Verify email is correct
2. Check password (case-sensitive)
3. Try admin credentials first
4. Clear browser cookies

### Check-In Not Working

1. Verify user is logged in
2. Check camera permissions
3. Try manual QR code input
4. Verify student QR code exists

### API Errors

```bash
# Check API health
curl https://plandi1jombang.vercel.app/api/health

# Check students endpoint
curl https://plandi1jombang.vercel.app/api/students | jq 'length'
```

## 📚 Documentation

- **Implementation Summary**: [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md)
- **API Integration Fix**: [docs/API_INTEGRATION_FIX.md](docs/API_INTEGRATION_FIX.md)
- **Admin System**: [docs/ADMIN_SYSTEM.md](docs/ADMIN_SYSTEM.md)
- **Camera Scanner**: [docs/CAMERA_SCANNER_UPDATE.md](docs/CAMERA_SCANNER_UPDATE.md)
- **Student Data**: [docs/STUDENT_DATA_UPDATE.md](docs/STUDENT_DATA_UPDATE.md)
- **Docker Deployment**: [docs/DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md)

## 🎓 Next Steps

1. **Change default passwords** for all accounts
2. **Test parent portal** with real student NIS
3. **Configure camera** for check-in scanner
4. **Set up backup** schedule for database
5. **Monitor API** usage and performance

## 💡 Tips

- Use **camera scanner** for fastest check-in
- **Wali Kelas** can only see their assigned class
- **Parent portal** requires NIS or exact name match
- **Leave requests** need parent info (name, contact)
- **QR codes** are in format: `STD001-3182391263`

---

**Last Updated**: 2026-01-07
**Status**: ✅ Production Ready
**URL**: https://plandi1jombang.vercel.app
