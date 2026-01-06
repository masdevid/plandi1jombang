# Admin System & Authentication

## Overview
Comprehensive admin system with authentication for teachers and staff. Includes role-based access control with special permissions for Wali Kelas (class teachers).

## Database Schema

### Users Table
Stores teachers, staff, and administrators.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  nip TEXT UNIQUE NOT NULL,                -- National ID Number
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,             -- SHA-256 hashed
  role TEXT NOT NULL,                      -- 'admin', 'teacher', 'staff'
  is_wali_kelas INTEGER NOT NULL DEFAULT 0, -- Flag for class teacher
  assigned_class TEXT,                     -- K1-K6 if wali kelas
  phone TEXT,
  photo TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Sessions Table
Manages authentication sessions.

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,              -- 64-character hex token
  expires_at TIMESTAMPTZ NOT NULL,         -- 7 days from creation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Default Users

The system is seeded with these default accounts:

### Administrator
- **Email**: admin@sdnplandi1jombang.sch.id
- **Password**: admin123
- **Role**: Full access to all classes and data
- **NIP**: 197001011995121001

### Wali Kelas (Class Teachers)
Each class (K1-K6) has an assigned Wali Kelas:

| Class | Email | Password | Teacher |
|-------|-------|----------|---------|
| K1 | siti.aminah@sdnplandi1jombang.sch.id | wali123 | Siti Aminah, S.Pd |
| K2 | ahmad.fauzi@sdnplandi1jombang.sch.id | wali123 | Ahmad Fauzi, S.Pd |
| K3 | nur.hidayah@sdnplandi1jombang.sch.id | wali123 | Nur Hidayah, S.Pd |
| K4 | eko.prasetyo@sdnplandi1jombang.sch.id | wali123 | Eko Prasetyo, S.Pd |
| K5 | rina.kartika@sdnplandi1jombang.sch.id | wali123 | Rina Kartika, S.Pd |
| K6 | doni.prasetya@sdnplandi1jombang.sch.id | wali123 | Doni Prasetya, S.Pd |

### Regular Teacher
- **Email**: dewi.lestari@sdnplandi1jombang.sch.id
- **Password**: teacher123
- **Role**: Teacher without class assignment

### Staff
- **Email**: agus.santoso@sdnplandi1jombang.sch.id
- **Password**: staff123
- **Role**: Administrative staff

## Authentication Flow

### Login Process
1. User enters email and password
2. Backend verifies credentials (SHA-256 password hash)
3. Creates session with 64-character hex token
4. Token expires after 7 days
5. Returns user data and token to client

### Session Management
- Token stored in localStorage: `authToken`
- User data stored in localStorage: `currentUser`
- Token expiry stored in localStorage: `tokenExpiry`
- Automatic logout on token expiration
- Manual logout deletes session from database

### Authorization
- **Auth Guard**: Protects admin routes
- **Verifies**: Token validity and user role
- **Allows**: Admin and Wali Kelas only
- **Redirects**: Unauthorized users to login or home

## API Endpoints

### Authentication API (/api/auth)

#### POST - Login
```typescript
POST /api/auth
Body: {
  action: "login",
  email: "admin@sdnplandi1jombang.sch.id",
  password: "admin123"
}

Response: {
  user: { id, nip, name, email, role, isWaliKelas, assignedClass, ... },
  token: "64-character-hex-string",
  expiresAt: "2026-01-13T12:00:00Z"
}
```

#### POST - Logout
```typescript
POST /api/auth
Headers: { Authorization: "Bearer <token>" }
Body: { action: "logout" }

Response: { message: "Logged out successfully" }
```

#### GET - Verify Token
```typescript
GET /api/auth
Headers: { Authorization: "Bearer <token>" }

Response: { user: { ... } }
```

### Admin API (/api/admin)

All endpoints require Authorization header with valid token.

#### GET - Dashboard Stats
```typescript
GET /api/admin?resource=dashboard

Response: {
  attendance: {
    total: 50,
    hadir: 45,
    terlambat: 3,
    izin: 1,
    sakit: 1,
    alpha: 0
  },
  totalStudents: 50,
  pendingLeaveRequests: 2,
  userRole: "admin",
  assignedClass: null
}
```

**Access Control**:
- Admin: All classes
- Wali Kelas: Only assigned class

#### GET - Attendance Records
```typescript
GET /api/admin?resource=attendance&date=2026-01-06
GET /api/admin?resource=attendance&class=K1
GET /api/admin?resource=attendance&date=2026-01-06&class=K1

Response: [
  {
    id, studentName, studentNis, studentClass,
    checkInTime, status, notes
  },
  ...
]
```

**Access Control**:
- Admin: All classes
- Wali Kelas: Only assigned class (automatic filtering)

#### GET - Leave Requests
```typescript
GET /api/admin?resource=leave-requests
GET /api/admin?resource=leave-requests&status=pending

Response: [
  {
    id, studentName, studentNis, studentClass,
    leaveType, reason, startDate, endDate, status
  },
  ...
]
```

#### PUT - Update Leave Request
```typescript
PUT /api/admin?resource=leave-requests
Body: {
  id: "req001",
  status: "approved"  // or "rejected"
}

Response: { message: "Leave request updated" }
```

**Access Control**:
- Admin: Can review all requests
- Wali Kelas: Can only review requests from assigned class

#### GET - Students
```typescript
GET /api/admin?resource=students

Response: [
  {
    id, nis, name, class, qrCode, active, createdAt
  },
  ...
]
```

**Access Control**:
- Admin: All students
- Wali Kelas: Only students from assigned class

## Frontend Components

### Login Page (/admin/login)
- **Route**: `/admin/login`
- **Access**: Public
- **Features**:
  - Email and password form
  - Error message display
  - Loading state during login
  - Auto-redirect if already logged in
  - Demo credentials shown for testing

### Admin Dashboard (/admin/dashboard)
- **Route**: `/admin/dashboard`
- **Access**: Protected by `authGuard`
- **Features**:
  - Real-time statistics cards
  - Attendance percentage chart
  - Recent attendance list
  - Pending leave request management
  - Quick action links
  - Logout functionality

#### Dashboard Statistics
1. **Total Students** - Count of active students
2. **Present Today** - Hadir + Terlambat with percentage
3. **Pending Leave** - Awaiting approval count
4. **Not Present** - Students not yet checked in

#### Dashboard Sections
- **Header**: User info, role display, logout button
- **Stats Cards**: 4 main KPIs with icons
- **Detailed Stats**: Breakdown by status (hadir, terlambat, izin, sakit, alpha)
- **Recent Attendance**: Last 10 check-ins today
- **Leave Requests**: Pending approvals with approve/reject buttons
- **Quick Actions**: Links to check-in, reports, and students

## Access Control

### Role-Based Permissions

#### Admin
- **Can Access**: All classes and data
- **Can View**: All students, all attendance, all leave requests
- **Can Manage**: All leave requests
- **Dashboard Shows**: School-wide statistics

#### Wali Kelas (Class Teacher)
- **Can Access**: Only assigned class
- **Can View**: Only their class students and attendance
- **Can Manage**: Only their class leave requests
- **Dashboard Shows**: Class-specific statistics

#### Teacher (Non-Wali)
- **Cannot Access**: Admin portal
- **Redirected**: To home page if attempting access

#### Staff
- **Cannot Access**: Admin portal
- **Redirected**: To home page if attempting access

### Automatic Filtering

The system automatically filters data based on user role:

```typescript
// Admin sees everything
const query = sql`SELECT * FROM students`;

// Wali Kelas sees only their class
const query = sql`SELECT * FROM students WHERE class = ${user.assigned_class}`;
```

## Security Features

### Password Hashing
- **Algorithm**: SHA-256
- **Storage**: Hex-encoded hash (64 characters)
- **Never Returned**: Password hashes never sent to client

### Session Security
- **Token Length**: 64 characters (256-bit entropy)
- **Expiration**: 7 days
- **Cleanup**: Automatic cleanup of expired sessions
- **One-Per-User**: New login invalidates old sessions

### Authorization Checks
1. **Route Level**: Auth guard checks before loading component
2. **API Level**: Every endpoint verifies token and role
3. **Data Level**: Automatic filtering by user permissions
4. **Client Level**: UI elements hidden based on role

### CORS Configuration
- **Enabled**: For development and production
- **Headers**: Content-Type, Authorization
- **Methods**: GET, POST, PUT, DELETE, OPTIONS

## Development & Testing

### Running Locally
```bash
# 1. Run database migration
pnpm db:migrate

# 2. Start development server
pnpm start

# 3. Access admin portal
# http://localhost:4200/admin/login
```

### Testing Accounts
Use the default credentials listed above to test different roles.

### Database Reset
```bash
# Drop and recreate all tables
pnpm db:migrate
```

## Production Deployment

### Environment Variables
```env
POSTGRES_URL=postgres://user:pass@host/db
```

### Vercel Deployment
1. Push code to repository
2. Environment variables auto-configured
3. Database migrations run automatically
4. HTTPS enforced (required for sessions)

### Security Checklist
- ✅ HTTPS required
- ✅ Password hashing (SHA-256)
- ✅ Session expiration (7 days)
- ✅ Token-based auth
- ✅ Role-based access control
- ✅ SQL injection protection
- ✅ CORS configuration
- ✅ Input validation

## Usage Examples

### As Admin
1. Login with admin credentials
2. See all classes statistics
3. Review all pending leave requests
4. Access all student data
5. View attendance across all classes

### As Wali Kelas
1. Login with class teacher credentials
2. See only assigned class statistics
3. Review only assigned class leave requests
4. Access only assigned class student data
5. View attendance for assigned class only

## File Structure

```
api/
├── auth.ts              # Authentication endpoints
├── admin.ts             # Admin dashboard endpoints
└── lib/
    └── database.ts      # Database with users & sessions

src/app/
├── guards/
│   └── auth.guard.ts    # Route protection
├── services/
│   └── auth.service.ts  # Auth state management
└── pages/admin/
    ├── login/           # Login page
    │   ├── login.ts
    │   ├── login.html
    │   └── login.css
    └── dashboard/       # Admin dashboard
        ├── dashboard.ts
        ├── dashboard.html
        └── dashboard.css
```

## Best Practices

### For Administrators
- Change default passwords immediately
- Review access logs regularly
- Monitor pending leave requests
- Keep user roles up to date

### For Developers
- Never commit credentials
- Always use auth headers for API calls
- Validate tokens on every request
- Filter data by user permissions
- Test with different roles

### For Wali Kelas
- Check dashboard daily
- Review leave requests promptly
- Monitor class attendance
- Report issues to admin

## Troubleshooting

### Cannot Login
- **Check**: Email and password spelling
- **Verify**: Account is active
- **Try**: Clear browser cache and cookies

### Session Expired
- **Cause**: Token expired after 7 days
- **Solution**: Login again

### Permission Denied
- **Check**: User role (must be admin or wali kelas)
- **Verify**: Account has correct role assigned

### Data Not Showing
- **Wali Kelas**: Verify `assigned_class` is set correctly
- **Admin**: Check database connection
- **All**: Verify token is valid

## Future Enhancements

### Planned Features
1. **Password Reset** - Email-based password recovery
2. **2FA Authentication** - Two-factor authentication
3. **Activity Logs** - Audit trail of all actions
4. **User Management UI** - Admin panel for user CRUD
5. **Bulk Actions** - Approve multiple leave requests
6. **Export Data** - Download attendance reports
7. **Notifications** - Email/SMS for pending requests
8. **Mobile App** - Native iOS/Android admin app

---

**Created**: 2026-01-06
**Status**: ✅ Complete
**Access**: Admin & Wali Kelas Only
**Security**: Token-based with role permissions
