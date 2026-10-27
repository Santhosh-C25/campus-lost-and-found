# Campus Lost & Found Management System

A full-stack web application that helps college students report, search, and recover lost and found items on campus.

---

## Problem Statement

Students frequently lose personal belongings on campus (phones, wallets, ID cards, laptops, etc.). Without a central digital system, lost items remain unclaimed or rely on informal notice boards. This project provides a structured, transparent platform with administrator oversight.

---

## Objectives

- Allow students to report lost and found items with photos and details.
- Enable keyword search and category/location filtering.
- Provide a claim submission and review workflow.
- Give administrators full oversight of reports, claims, and users.
- Implement secure authentication and authorization.

---

## Features

### Student
- Register and log in securely
- Browse, search, and filter all item reports
- Report a lost or found item with photo upload
- View full item details
- Submit a claim on a found item
- Track claim status (Pending / Approved / Rejected)
- Manage (edit, delete, resolve) own reports
- Update profile and change password

### Administrator
- Secure admin login (no public registration)
- Dashboard with live statistics
- View and manage all reports (resolve, delete)
- Review, approve, or reject claims with notes
- Manage user accounts (activate/deactivate/delete)
- View recent activity feed

---

## Technology Stack

| Layer      | Technology                            |
|------------|---------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript       |
| Backend    | Node.js 18+, Express.js 4.x           |
| Database   | MongoDB (Atlas), Mongoose 8.x         |
| Auth       | express-session + connect-mongo       |
| Passwords  | bcryptjs (12 salt rounds)             |
| Images     | Multer (local disk storage)           |
| Security   | Helmet, express-rate-limit, mongo-sanitize |

---

## Project Structure

```
campus-lost-found/
├── public/                  # Frontend HTML, CSS, JS
│   ├── css/style.css        # Complete stylesheet
│   ├── js/utils.js          # Shared JS utilities
│   ├── index.html           # Home page
│   ├── login.html           # Login page
│   ├── register.html        # Registration page
│   ├── items.html           # Browse all items
│   ├── item-details.html    # Single item view
│   ├── report-lost.html     # Report lost item form
│   ├── report-found.html    # Report found item form
│   ├── edit-item.html       # Edit own report
│   ├── my-reports.html      # Student's reports
│   ├── my-claims.html       # Student's claims
│   ├── claim.html           # Submit claim form
│   ├── profile.html         # Profile & password change
│   ├── about.html           # About page
│   ├── contact.html         # Contact & FAQ
│   ├── 404.html             # Custom 404 page
│   └── admin/
│       ├── dashboard.html   # Admin dashboard
│       ├── reports.html     # Manage all reports
│       ├── claims.html      # Review claims
│       └── users.html       # Manage users
├── src/
│   ├── config/database.js   # MongoDB connection
│   ├── models/
│   │   ├── User.js          # User schema
│   │   ├── Item.js          # Item schema
│   │   └── Claim.js         # Claim schema
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── itemController.js
│   │   ├── claimController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── itemRoutes.js
│   │   ├── claimRoutes.js
│   │   └── adminRoutes.js
│   └── middleware/
│       ├── auth.js          # requireAuth / requireAdmin
│       ├── upload.js        # Multer configuration
│       └── errorHandler.js  # Global error handler
├── uploads/images/          # Uploaded item photos
├── scripts/seed.js          # Demo data seed script
├── server.js                # Express application entry
├── package.json
├── .env.example             # Environment template
└── .gitignore
```

---

## Database Schema

### User
| Field      | Type    | Notes                        |
|------------|---------|------------------------------|
| name       | String  | Required, 2–60 chars         |
| email      | String  | Required, unique, lowercase  |
| password   | String  | Hashed with bcrypt           |
| role       | String  | 'student' (default) or 'admin' |
| studentId  | String  | Optional                     |
| phone      | String  | Optional                     |
| department | String  | Optional                     |
| isActive   | Boolean | Default true                 |
| lastLogin  | Date    |                              |

### Item
| Field        | Type       | Notes                                  |
|--------------|------------|----------------------------------------|
| itemName     | String     | Required                               |
| description  | String     | Required, min 10 chars                 |
| reportType   | String     | 'Lost' or 'Found'                      |
| category     | String     | Electronics, Documents, Bags, etc.     |
| dateOccurred | Date       | Required                               |
| location     | String     | Required                               |
| imagePath    | String     | Relative URL to uploaded image         |
| status       | String     | Open / Claim Pending / Resolved        |
| reportedBy   | ObjectId   | Ref: User                              |

### Claim
| Field              | Type     | Notes                         |
|--------------------|----------|-------------------------------|
| item               | ObjectId | Ref: Item                     |
| claimedBy          | ObjectId | Ref: User                     |
| explanation        | String   | Required, min 20 chars        |
| identifyingDetails | String   | Optional                      |
| status             | String   | Pending / Approved / Rejected |
| reviewedBy         | ObjectId | Ref: User (admin)             |
| adminNotes         | String   | Optional                      |

---

## Installation & Setup

### Prerequisites
- Node.js 18 or later: https://nodejs.org
- npm (bundled with Node.js)
- A MongoDB Atlas account: https://cloud.mongodb.com

### 1. Clone or download the project
```bash
git clone <your-repo-url>
# or just place the project folder wherever you like
cd "campus-lost-found"
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`:
```bash
copy .env.example .env     # Windows
```
Then open `.env` and fill in:
- `MONGODB_URI` – your Atlas connection string (see below)
- `SESSION_SECRET` – any long random string
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` – your desired admin credentials

### 4. MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com and sign in (or create a free account).
2. Create a new **Free Tier (M0)** cluster.
3. Under **Database Access**, create a database user with a strong password.
4. Under **Network Access**, click **Add IP Address → Allow Access from Anywhere** (or add your IP).
5. Under **Clusters → Connect → Connect your application**, copy the connection string. It looks like:
   ```
   mongodb+srv://myUser:myPassword@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add `campus-lost-found` as the database name:
   ```
   mongodb+srv://myUser:myPassword@cluster0.abcde.mongodb.net/campus-lost-found?retryWrites=true&w=majority
   ```
7. Paste this into `MONGODB_URI` in your `.env` file.

### 5. Seed demo data (optional but recommended)
```bash
npm run seed
```
This creates:
- **Admin account**: admin@campus.edu / Admin@123456
- **3 student accounts**: alice@student.edu, bob@student.edu, carol@student.edu (all password: Student@123)
- **8 demo item reports** across multiple categories

### 6. Start the server
```bash
# Development mode (auto-restart on file changes)
npm run dev

# Production mode
npm start
```
The app will be available at: **http://localhost:3000**

---

## API Endpoints

### Authentication
| Method | Endpoint            | Description              | Auth    |
|--------|---------------------|--------------------------|---------|
| POST   | /api/auth/register  | Register new student     | Public  |
| POST   | /api/auth/login     | Login                    | Public  |
| POST   | /api/auth/logout    | Logout                   | Student |
| GET    | /api/auth/status    | Get current session info | Public  |
| GET    | /api/auth/me        | Get current user profile | Student |

### Items
| Method | Endpoint              | Description                    | Auth    |
|--------|-----------------------|--------------------------------|---------|
| GET    | /api/items            | List/search items (paginated)  | Public  |
| GET    | /api/items/my         | Current user's items           | Student |
| GET    | /api/items/admin      | All items (admin view)         | Admin   |
| GET    | /api/items/:id        | Single item detail             | Public  |
| POST   | /api/items            | Create item report             | Student |
| PUT    | /api/items/:id        | Update item report             | Student/Admin |
| DELETE | /api/items/:id        | Delete item report             | Student/Admin |
| PUT    | /api/items/:id/resolve| Mark item resolved             | Student/Admin |

### Claims
| Method | Endpoint                     | Description                | Auth    |
|--------|------------------------------|----------------------------|---------|
| POST   | /api/claims                  | Submit a claim             | Student |
| GET    | /api/claims/my               | Current user's claims      | Student |
| GET    | /api/claims/:id              | Single claim detail        | Student/Admin |
| GET    | /api/claims/admin/all        | All claims                 | Admin   |
| PUT    | /api/claims/admin/:id/review | Approve or reject claim    | Admin   |
| DELETE | /api/claims/admin/:id        | Delete a claim             | Admin   |

### Users
| Method | Endpoint                            | Description         | Auth    |
|--------|-------------------------------------|---------------------|---------|
| GET    | /api/users/profile                  | Get profile         | Student |
| PUT    | /api/users/profile                  | Update profile      | Student |
| PUT    | /api/users/change-password          | Change password     | Student |
| GET    | /api/users/admin/users              | List all users      | Admin   |
| PUT    | /api/users/admin/users/:id/toggle-status | Activate/Deactivate | Admin |
| DELETE | /api/users/admin/users/:id          | Delete user         | Admin   |

### Admin
| Method | Endpoint             | Description         | Auth  |
|--------|----------------------|---------------------|-------|
| GET    | /api/admin/dashboard | Dashboard stats     | Admin |

---

## Testing the Application

### Student Flow
1. Visit http://localhost:3000 and click **Register**
2. Create an account (or use demo: alice@student.edu / Student@123)
3. Browse items on the **Browse Items** page
4. Use filters: type, category, location, date range
5. Click **Report Lost Item** and fill in the form with a photo
6. Find a Found item and click **Submit a Claim**
7. Check **My Claims** for claim status
8. Check **My Reports** to edit or delete your report

### Admin Flow
1. Login with admin@campus.edu / Admin@123456
2. You'll be redirected to the **Admin Dashboard**
3. View statistics and recent activity
4. Go to **Manage Reports** to resolve or delete reports
5. Go to **Manage Claims** to review pending claims – approve or reject with notes
6. Go to **Manage Users** to activate/deactivate students

---

## Security Features

- Passwords hashed with bcrypt (12 rounds)
- Session-based authentication stored in MongoDB
- Helmet.js security headers (CSP, XSS protection, etc.)
- Rate limiting on login/register endpoints (20 req/15 min)
- General API rate limiting (300 req/15 min)
- MongoDB injection prevention via express-mongo-sanitize
- File upload validation (type + size)
- Authorization checks on every protected route
- Admin role can never be set through public registration
- Sensitive fields excluded from API responses

---

## Known Limitations

1. Images are stored locally in `uploads/images/`. For production, use a cloud storage service (AWS S3, Cloudinary).
2. No email notifications. A production system would send email on claim approval/rejection.
3. No password reset flow via email.
4. The admin account can only be created via the seed script or manually in MongoDB.

---

## Project Report Outline

**Title**: Campus Lost and Found Management System

1. **Abstract** – Brief summary of the problem, solution, and technologies used.
2. **Introduction** – Context of the problem in a college environment; objectives of the system.
3. **Existing System** – Manual notice boards and informal group messages; limitations (no tracking, no claim workflow, no accountability).
4. **Proposed System** – Web-based system with roles, item reporting, image upload, claim management, and admin oversight. Advantages over the existing system.
5. **Requirements**
   - Functional: User registration/login, item CRUD, image upload, search/filter, claim workflow, admin dashboard.
   - Non-functional: Security, responsiveness, performance, usability.
   - Hardware/Software requirements.
6. **System Design**
   - Architecture diagram (Client → Express API → MongoDB).
   - Database schema (User, Item, Claim ERD).
   - Use case diagram.
   - Sequence diagram for claim workflow.
7. **Implementation**
   - Frontend: HTML/CSS/JS structure, responsive design, reusable utilities.
   - Backend: Express REST API, Mongoose models, middleware.
   - Authentication: session-based with bcrypt password hashing.
   - File upload: Multer, type and size validation.
   - Security: Helmet, rate limiting, sanitization.
8. **Testing**
   - Registration and login (valid/invalid credentials).
   - Item creation, editing, deletion, resolution.
   - Image upload and rejection of invalid file types.
   - Claim submission and duplicate prevention.
   - Claim approval/rejection and item status update.
   - Admin access control (non-admin cannot access admin routes).
   - Pagination and filtering.
9. **Results & Screenshots** – Screenshots of every page; result of each test case.
10. **Conclusion** – Summary of what was achieved; future enhancements (email notifications, cloud storage, mobile app).
11. **References** – Node.js docs, Express docs, MongoDB docs, Mongoose docs, MDN Web Docs.
