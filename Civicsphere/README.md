# CivicSphere AI - Civic & Legal Intelligence Platform

CivicSphere AI is a full-stack civic intelligence platform providing legal guidance, case management, secure evidence vaults, and collaboration between **Citizens** and **Advocates/Legal Counsel**, powered by strict Role-Based Access Control (RBAC).

---

## 1. Exact Folder Structure

```
CivicSphere/
├── package.json                  # Workspace script runner
├── README.md                     # Documentation & setup instructions
│
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic & offline-safe logger
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, GetMe, UpdateProfile, Lawyer List
│   │   ├── citizenController.js  # Citizen analytics & dashboard stats
│   │   ├── lawyerController.js   # Lawyer docket analytics & client directory
│   │   ├── caseController.js     # Case CRUD, ownership checks & assignment
│   │   └── documentController.js # Document vault metadata, status & case linking
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT Bearer verification & req.user attachment
│   │   ├── roleMiddleware.js     # authorizeRoles('CITIZEN', 'LAWYER') guard (403)
│   │   └── errorMiddleware.js    # notFound & centralized error handling
│   ├── models/
│   │   ├── User.js               # Citizen & Lawyer user schema with bcrypt hashing
│   │   ├── Case.js               # Legal cases with status, priority & category
│   │   └── Document.js           # Document vault with status & case reference
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   ├── citizenRoutes.js      # /api/citizen endpoints (CITIZEN only)
│   │   ├── lawyerRoutes.js       # /api/lawyer endpoints (LAWYER only)
│   │   ├── caseRoutes.js         # /api/cases endpoints (role-scoped)
│   │   └── documentRoutes.js     # /api/documents endpoints (role-scoped)
│   ├── utils/
│   │   └── generateToken.js      # JWT token signer
│   ├── server.js                 # Express server bootstrap & middleware pipeline
│   ├── .env                      # Local environment configuration
│   ├── .env.example              # Environment variables template
│   └── package.json              # Backend dependencies and scripts
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── ui/
    │   │   │   ├── Button.jsx        # Variants (primary, secondary, outline, subtle, danger)
    │   │   │   ├── Input.jsx         # Form controls (input, select, textarea) with icons & errors
    │   │   │   ├── Card.jsx          # Container with CardHeader, CardTitle, CardContent, CardFooter
    │   │   │   ├── Badge.jsx         # Status, priority & role badges with indicator dots
    │   │   │   └── Modal.jsx         # Accessible modal dialog with backdrop
    │   │   ├── layout/
    │   │   │   ├── Sidebar.jsx       # Role-aware navigation (Citizen vs Lawyer)
    │   │   │   ├── Header.jsx        # Sticky topbar with profile avatar & role badge
    │   │   │   └── DashboardLayout.jsx # Master responsive shell layout
    │   │   └── common/
    │   │       ├── PageHeader.jsx    # Standard page title, description & actions
    │   │       ├── StatCard.jsx      # Metric stat cards with trend badges & icons
    │   │       ├── EmptyState.jsx    # Clean empty illustration & CTA
    │   │       ├── LoadingState.jsx  # Polished spinner loader
    │   │       ├── ErrorState.jsx    # Error banner with retry action
    │   │       └── AccessDenied.jsx  # 403 Forbidden screen
    │   ├── pages/
    │   │   ├── public/
    │   │   │   ├── LandingPage.jsx   # Hero, platform highlights & dual role pathways
    │   │   │   ├── LoginPage.jsx     # Auth login with instant demo credentials fill
    │   │   │   └── RegisterPage.jsx  # Role selector & registration form
    │   │   ├── citizen/
    │   │   │   ├── CitizenDashboard.jsx  # Metrics, recent cases & quick case filing
    │   │   │   ├── CitizenCases.jsx      # Case search, status filters & details modal
    │   │   │   ├── CitizenDocuments.jsx  # Evidence vault, upload modal & case linking
    │   │   │   ├── CitizenProfile.jsx    # Personal details & password update
    │   │   │   └── CitizenSettings.jsx   # Alert preferences & security policies
    │   │   └── lawyer/
    │   │       ├── LawyerDashboard.jsx   # Metrics, active cases, intake pool & deadlines
    │   │       ├── LawyerCases.jsx       # Assigned vs Open cases, status updater & notes
    │   │       ├── LawyerClients.jsx     # Client roster with case portfolio breakdown
    │   │       ├── LawyerDocuments.jsx   # Client evidence review & verification
    │   │       ├── LawyerProfile.jsx     # Bar council registration, specialization & bio
    │   │       └── LawyerSettings.jsx    # Intake availability & daily digest options
    │   ├── context/
    │   │   └── AuthContext.jsx       # Global auth state, session persistence & hooks
    │   ├── routes/
    │   │   ├── AppRoutes.jsx         # Complete application route mapping
    │   │   └── ProtectedRoute.jsx   # JWT validation & role-based clearance guards
    │   ├── services/
    │   │   ├── api.js                # Axios instance with Bearer JWT injection & 401 handler
    │   │   ├── authService.js        # Authentication & dashboard endpoints
    │   │   ├── caseService.js        # Case CRUD & assignment operations
    │   │   └── documentService.js    # Document vault operations
    │   ├── App.jsx                   # Root application entry
    │   ├── main.jsx                  # React DOM root with BrowserRouter
    │   └── index.css                 # Tailwind CSS & custom civic typography
    ├── index.html
    ├── vite.config.js
    ├── .env
    ├── .env.example
    └── package.json
```

---

## 2. Installation & Quick Start Commands

### Step 1: Install Dependencies
Run from workspace root:
```bash
npm run install:all
```
Or install in each directory individually:
```bash
# In backend/
cd backend
npm install

# In frontend/
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/civicsphere
JWT_SECRET=civicsphere_super_secret_jwt_key_982347293847293847
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 3: Start the Backend & Frontend Servers

**Start Backend:**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Start Frontend:**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

Or from the root directory:
```bash
npm run backend:dev
npm run frontend
```

---

## 3. Required npm Packages

### Backend (`backend/package.json`):
- `express` (^4.21.2) - Fast, minimalist web framework
- `mongoose` (^8.9.5) - MongoDB object modeling tool
- `bcryptjs` (^3.0.3) - Password hashing
- `jsonwebtoken` (^9.0.2) - JWT authentication
- `cors` (^2.8.5) - Cross-Origin Resource Sharing
- `dotenv` (^16.4.7) - Environment variable management

### Frontend (`frontend/package.json`):
- `react` & `react-dom` (^19.0.0) - Modern React UI library
- `react-router-dom` (^7.1.5) - Client-side declarative routing
- `axios` (^1.7.9) - Promise based HTTP client with interceptors
- `lucide-react` (^0.475.0) - Icon library
- `tailwindcss` & `@tailwindcss/vite` (^4.0.0) - Utility-first CSS framework
- `clsx` & `tailwind-merge` - Dynamic class composition

---

## 4. Authentication & RBAC Architecture

### Registration Flow:
1. User provides full name, email, password, and chooses a role (`CITIZEN` or `LAWYER`).
2. Password is automatically hashed with `bcryptjs` using a salt work factor of 10 in `User.js` pre-save hook.
3. User is persisted in MongoDB and signed with a 30-day JWT containing `{ id: user._id, role: user.role }`.
4. Response returns safe user object (excluding password) and JWT token.

### Login Flow:
1. User authenticates with email & password at `/api/auth/login`.
2. Password comparison is performed using `bcrypt.compare()`.
3. React receives JWT and user profile, persisting them to `localStorage` via `AuthContext`.
4. User is redirected dynamically:
   - `CITIZEN` $\rightarrow$ `/citizen/dashboard`
   - `LAWYER` $\rightarrow$ `/lawyer/dashboard`

### Role-Based Access Control (RBAC):
- **Backend Middleware**: `authorizeRoles('CITIZEN')` and `authorizeRoles('LAWYER')` strictly enforce role restrictions. Unauthorized requests return `403 Forbidden`.
- **Ownership Authorization**: Cases can only be accessed or modified by their creating citizen or assigned lawyer.
- **Frontend Route Protection**: `ProtectedRoute` checks active session and role clearance. Unauthorized users are shown a polished `AccessDenied` (403) view.

---

## 5. API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new Citizen or Lawyer |
| `POST` | `/api/auth/login` | Public | Authenticate user & retrieve JWT |
| `GET` | `/api/auth/me` | Private | Retrieve current user profile |
| `PUT` | `/api/auth/profile` | Private | Update name, phone, bio, password |
| `GET` | `/api/auth/lawyers` | Private | Directory of registered advocates |

### Citizen Endpoints (`/api/citizen`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/citizen/dashboard` | Private (`CITIZEN`) | Total cases, documents & deadlines |

### Lawyer Endpoints (`/api/lawyer`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/lawyer/dashboard` | Private (`LAWYER`) | Assigned matters, active clients & pool |
| `GET` | `/api/lawyer/clients` | Private (`LAWYER`) | Client directory with case portfolios |

### Case Management (`/api/cases`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/cases` | Private | List role-scoped cases (with filters) |
| `POST` | `/api/cases` | Private (`CITIZEN`) | File a new legal case |
| `GET` | `/api/cases/:id` | Private (Owner/Counsel) | Retrieve single case dossier & docs |
| `PUT` | `/api/cases/:id` | Private (Owner/Counsel) | Update case details or progression status |
| `PUT` | `/api/cases/:id/assign` | Private | Lawyer accepts or Citizen assigns counsel |
| `DELETE` | `/api/cases/:id` | Private (`CITIZEN` Owner) | Remove open case record |

### Document Vault (`/api/documents`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/documents` | Private | List accessible evidence files |
| `POST` | `/api/documents` | Private | Store document metadata & link to case |
| `GET` | `/api/documents/:id` | Private (Owner/Counsel) | Inspect document record |
| `PUT` | `/api/documents/:id/status`| Private | Update document status (READY/PROCESSING) |
| `DELETE` | `/api/documents/:id` | Private (Uploader) | Remove document from vault |

---

## 6. End-to-End Verification Guide

### Test 1: Register as Citizen
1. Navigate to `http://localhost:5173/register`
2. Select **Citizen** role. Enter Name, Email, Password, and click **Complete Registration**.
3. Verify automatic redirection to `/citizen/dashboard`.
4. Click **File New Case** to submit a legal matter ("Property Boundary Dispute").
5. Go to **My Documents** and upload an evidence document linked to your case.

### Test 2: Register as Lawyer
1. Open an incognito browser window or log out.
2. Navigate to `http://localhost:5173/register`
3. Select **Legal Counsel** role. Enter Name, Email, Specialization, Bar Council ID, and Password.
4. Verify automatic redirection to `/lawyer/dashboard`.
5. Under **Open Citizen Matters Pool**, find the case filed in Test 1 and click **Accept Case**.
6. Switch to `/lawyer/cases`, open **Manage / Update Status**, update status to `IN_PROGRESS`, add lawyer notes, and save.

### Test 3: Verify RBAC Protection
1. Logged in as Citizen, manually navigate to `http://localhost:5173/lawyer/dashboard`.
2. Notice the UI displays **403 Forbidden: Access Restricted** screen with a "My Dashboard" return button.
3. Test direct API call without token or with wrong role:
   ```bash
   # Unauthenticated request returns 401
   curl http://localhost:5000/api/citizen/dashboard

   # Citizen token accessing /api/lawyer/dashboard returns 403 Forbidden
   ```
