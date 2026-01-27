# Digital ID System

A comprehensive identity management platform with an elegant Admin Portal for managing users, KYC verification, services, and system monitoring. The system supports both English and Khmer languages.

## 🌟 Features

### Admin Portal

#### 1. **Dashboard**
- Real-time statistics cards showing:
  - Total Users
  - Pending KYC Verifications
  - Active Users
  - Active Sessions
- Elegant card-based design with color-coded icons

#### 2. **User Management**
- Complete user list with:
  - User photos and profiles
  - Khmer and English names
  - National ID information
  - Username, email, phone number
  - User status (Active/Pending/Blocked)
- Full CRUD operations:
  - Edit user information
  - Update user status
  - Delete users
- Advanced filtering and search

#### 3. **KYC Verification**
- Pending KYC submissions list
- Document viewer for:
  - National ID front photo
  - National ID back photo
  - Selfie with ID
- Approve/Reject functionality with reason tracking
- Automatic user status updates upon approval

#### 4. **Service Management**
- Manage connected third-party services
- Features:
  - Add new services
  - Edit service details
  - Token and secret generation
  - Regenerate credentials
  - Activate/deactivate services
  - Delete services
- Copy-to-clipboard for credentials

#### 5. **System Logs**
- Comprehensive activity logging
- Log types:
  - Login/Logout
  - KYC submissions and approvals
  - Service connections
  - QR code scans
  - Profile updates
  - Admin actions
- Export logs to CSV/Excel
- Clear all logs functionality

#### 6. **System Settings**
- **General Configuration:**
  - Maintenance mode toggle
  - KYC user creation toggle
- **Telegram OTP Configuration:**
  - Bot token
  - Bot ID
- **SMS OTP Configuration:**
  - Provider settings
  - API credentials
  - Sender ID
- **Language Settings:**
  - Switch between English and Khmer

### Backend API

All features are powered by a comprehensive tRPC API with the following routers:

- **Dashboard:** Statistics and metrics
- **Users:** User management CRUD
- **KYC:** Verification workflows
- **Services:** Service management
- **Logs:** Activity logging
- **Settings:** System configuration
- **Profile:** User profile management
- **Notifications:** User notifications
- **QR Auth:** QR code authentication tokens

### Database Schema

The system uses a comprehensive MySQL/TiDB database with the following tables:

1. **users** - Core user information with KYC fields
2. **kycDocuments** - Identity verification documents
3. **services** - Connected third-party services
4. **userServices** - User-service relationships
5. **activityLogs** - System activity tracking
6. **systemSettings** - Configuration storage
7. **activeSessions** - Session management
8. **notifications** - User notifications
9. **qrAuthTokens** - QR authentication tokens

## 🎨 Design System

### Color Palette
- **Primary:** Deep blue (oklch(45% 0.15 240))
- **Accent:** Gold (oklch(65% 0.12 50))
- **Background:** Light (oklch(98% 0.01 240))
- **Foreground:** Dark (oklch(20% 0.02 240))

### Typography
- **Primary Font:** Inter
- **Khmer Font:** Noto Sans Khmer
- Clean, professional, and highly readable

### UI Components
- Elegant card-based layouts
- Smooth transitions and hover effects
- Responsive design for all screen sizes
- Accessible and keyboard-friendly

## 🌐 Multi-Language Support

The system fully supports both English and Khmer languages:

- **Language Switcher:** Available in System Settings
- **Persistent Selection:** Language preference saved to localStorage
- **Comprehensive Translations:** All UI elements translated
- **Context-Aware:** Uses React Context for global language state

### Supported Languages
- 🇬🇧 English (en)
- 🇰🇭 ខ្មែរ Khmer (km)

## 🔐 Authentication & Authorization

### Role-Based Access Control
- **Admin Role:** Full access to all features
- **User Role:** Limited access (profile, services, notifications)

### Security Features
- Session-based authentication via Manus OAuth
- Protected procedures with role checks
- Secure cookie handling
- Password fields for sensitive configuration

## 📱 Mobile App Integration

The backend API fully supports mobile app functionality:

### Available Endpoints
- **Profile Management:** Update user information, photos, PIN
- **KYC Submission:** Upload identity documents
- **Service Connection:** Connect/disconnect services
- **Notifications:** Receive system notifications
- **QR Authentication:** Generate and verify QR tokens
- **Activity History:** View user activity logs
- **Biometric Settings:** Enable/disable Face ID/Fingerprint
- **2FA Settings:** Two-factor authentication management

### Mobile App Features (API-Ready)
1. **KYC Registration Flow**
   - Camera/upload for NID front, back, and selfie
   - Telegram OTP verification
   - PIN setup
   - Biometric enrollment

2. **User Dashboard**
   - Profile card with edit functionality
   - Connected services management
   - Notifications feed
   - QR scanner for authentication
   - Activity history

3. **Settings**
   - Change PIN
   - 2-step verification
   - Language selection
   - Terms, Privacy, Help, About pages

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- MySQL/TiDB database
- pnpm package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (automatically configured in Manus)

4. Push database schema:
   ```bash
   pnpm db:push
   ```

5. Start development server:
   ```bash
   pnpm dev
   ```

6. Run tests:
   ```bash
   pnpm test
   ```

### Production Build

```bash
pnpm build
pnpm start
```

## 📊 API Documentation

### Dashboard Statistics
```typescript
trpc.dashboard.getStats.useQuery()
// Returns: { totalUsers, pendingKyc, activeUsers, activeSessions }
```

### User Management
```typescript
trpc.users.getAll.useQuery()
trpc.users.update.useMutation({ id, data })
trpc.users.delete.useMutation({ id })
```

### KYC Verification
```typescript
trpc.kyc.getPending.useQuery()
trpc.kyc.approve.useMutation({ id })
trpc.kyc.reject.useMutation({ id, reason })
trpc.kyc.submit.useMutation({ nidFrontUrl, nidBackUrl, selfieUrl })
```

### Service Management
```typescript
trpc.services.getAll.useQuery()
trpc.services.create.useMutation({ name, ... })
trpc.services.update.useMutation({ id, data })
trpc.services.delete.useMutation({ id })
trpc.services.regenerateCredentials.useMutation({ id })
```

### System Logs
```typescript
trpc.logs.getAll.useQuery()
trpc.logs.clear.useMutation()
```

### System Settings
```typescript
trpc.settings.get.useQuery()
trpc.settings.update.useMutation({ maintenanceMode, ... })
```

## 🧪 Testing

The system includes comprehensive test coverage:

- **Auth Tests:** Logout functionality
- **Dashboard Tests:** Statistics and access control
- **User Management Tests:** CRUD operations
- **Service Tests:** Public and admin access

Run all tests:
```bash
pnpm test
```

## 📝 Activity Logging

All significant actions are automatically logged:

- User authentication (login/logout)
- KYC submissions and verifications
- Service connections/disconnections
- QR code scans
- Profile updates
- Admin actions

Logs include:
- User information
- Action type and description
- Timestamp
- IP address and user agent (when available)

## 🔧 Configuration

### System Settings
Configure the system through the Settings page:

1. **Maintenance Mode:** Temporarily disable user access
2. **KYC User Creation:** Control new user registration
3. **Telegram OTP:** Configure Telegram bot for verification
4. **SMS OTP:** Set up SMS provider for verification

### Environment Variables
All sensitive configuration is managed through environment variables:
- Database connection
- OAuth credentials
- API keys and secrets

## 🎯 Best Practices

### For Administrators
1. Regularly review pending KYC verifications
2. Monitor system logs for suspicious activity
3. Keep service credentials secure
4. Export logs periodically for backup
5. Update system settings as needed

### For Developers
1. Use tRPC procedures for all API calls
2. Follow the established database schema
3. Add activity logging for new features
4. Write tests for new functionality
5. Maintain multi-language support

## 📦 Tech Stack

- **Frontend:** React 19, TypeScript, TailwindCSS 4
- **Backend:** Express 4, tRPC 11
- **Database:** MySQL/TiDB with Drizzle ORM
- **Authentication:** Manus OAuth
- **UI Components:** shadcn/ui with Radix UI
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Notifications:** Sonner
- **Testing:** Vitest

## 🌟 Key Highlights

✅ **Production-Ready:** Fully functional admin portal with all core features
✅ **Elegant Design:** Professional UI with deep blue and gold accent colors
✅ **Multi-Language:** Complete English and Khmer support
✅ **Comprehensive API:** All mobile app features supported
✅ **Secure:** Role-based access control and session management
✅ **Tested:** Unit tests for critical functionality
✅ **Scalable:** Clean architecture with tRPC and type safety
✅ **Documented:** Extensive inline documentation and README

## 📄 License

MIT License

## 👥 Support

For questions or issues, please contact the development team.

---

**Built with ❤️ for Digital ID**
