# LibraryHub – Complete Library Management System
### Full-Stack Architecture & Experiment Implementation (Experiments 1 to 8)

A comprehensive Library Management System built with **React 19**, **Vite**, **Express.js 5**, **Node.js**, and **MongoDB Atlas**, featuring a complete **Admin Dashboard**, **JWT Role-Based Authentication**, **Advanced Server-Side Querying & Pagination**, **MongoDB Aggregation Pipelines**, and **Borrow / Return Lending Management**.

---

## 1. Quick Start Guide

### Prerequisites
* **Node.js**: v18+ or v20+
* **npm**: v9+
* **MongoDB Atlas** database connection string

### Step 1: Backend Setup & Launch

```bash
cd library-management-system/backend
npm install
npm run dev
```

The backend server boots on **`http://localhost:5000`**.
On first startup, the system automatically verifies connection to MongoDB Atlas (`libraryDB`) and seeds a default Administrator account if one does not already exist.

### Step 2: Frontend Setup & Launch

Open a second terminal:

```bash
cd library-management-system
npm install
npm run dev -- --port 5273
```

Open your browser at **`http://localhost:5273`** (or `http://localhost:5173`).

---

## 2. Administrator & Evaluation Credentials

For evaluating the **Admin Dashboard** and role-protected operations, use the seeded credentials below:

| Role | Email Address | Password | Privileges |
|---|---|---|---|
| **Administrator** | `admin@libraryhub.com` | `Admin@12345` | Full Admin Dashboard (`/admin`), Book CRUD, Patron Management, Loan Returns |
| **New Reader / Member** | *Register any email via `/login`* | *Minimum 6 chars* | Browse, Search, Aggregated Stats, Borrow Books, View Loans (`/my-books`) |

*(On the Login screen, a "Fill Admin" shortcut button is provided for convenience).*

---

## 3. Implemented Curriculum Experiments

### Experiment 01 & 02: Responsive Component Layout, State & Props
* **Home Page (`/`)**: Hero banner with illustrated book stack, live statistics badges, and interactive collection preview.
* **Component Architecture**: Modular navigation bar, cards, filters, and dynamic reactivity.

### Experiment 03: React Context & Reducer State Management
* **Route**: `/experiment-3`
* **Features**: Dedicated Experiment 3 interface managing state via `useReducer` and `Experiment3Context`. Supports real-time search, category dropdown, favorite toggling, availability filters, and book deletion.

### Experiment 04: Form Handling, Validation & Edit Operations
* **Add Book**: Accessible from the Navbar, Hero banner, Search Books, and Admin Dashboard.
* **Edit Book**: Every book card and admin table row includes an **Edit** button that launches a prefilled modal.
* **Validation**:
  * Client-side validation for title (required, max 150 chars), author (required, max 100 chars), category, non-negative price, and availability.
  * Server-side payload sanitization and schema-level validation in Express & Mongoose.
* **Notifications**: Non-blocking Toast notification system (`ToastContext`) displaying animated success, warning, and error messages.

### Experiment 05: Advanced Querying, Server-Side Filtering, Searching & Pagination
* **Route**: `/search-books`
* **Backend Endpoint**: `GET /api/books?search=...&category=...&available=...&sortBy=...&order=...&page=...&limit=...`
* **Features**:
  * Server-side regex search by title, author, or keyword.
  * Server-side category filtering.
  * Server-side availability status filtering (`all`, `available`, `borrowed`).
  * Multi-field sorting by addition date (`createdAt`), title (`title`), and price (`price`).
  * Server-side pagination with controls and total item counters.
  * Database indexes created on `title`, `author`, `category`, `price`, and `createdAt` for high performance.

### Experiment 06: MongoDB Aggregation Pipelines & Analytics
* **Route**: `/statistics`
* **Backend Endpoint**: `GET /api/books/stats`
* **Features**:
  * Utilizes a single multi-stage `$facet` MongoDB aggregation pipeline.
  * Computes total books, available books, borrowed books, total distinct categories, total inventory valuation (`$sum: "$price"`), and average book price (`$avg: "$price"`).
  * Category-wise breakdown via `$group` computing book count, available count, borrowed count, average price, and percentage of collection.
  * Available vs Borrowed ratio visual indicator.

### Experiment 07: Authentication & Authorization with JWT & Bcrypt
* **Route**: `/login`
* **Backend Endpoints**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
* **Features**:
  * Secure passwords hashed with salt using `bcryptjs` before storage; passwords never exposed in responses (`toJSON` deletion).
  * JWT generation with expiration.
  * `verifyToken` middleware parsing `Authorization: Bearer <token>`.
  * `requireAdmin` role-based authorization guard.
  * Public registration strictly enforces `role: "user"` to prevent privilege escalation.
  * Dynamic navigation rendering and route protection based on authentication state.

### Experiment 08: Borrowing, Returning & Activity Management
* **Route**: `/my-books` (Patron view) & `/admin` (Admin view)
* **Backend Endpoints**:
  * `POST /api/borrow/:bookId`: Borrow available book (prevents duplicate active borrows).
  * `POST /api/borrow/return/:recordId`: Return book and automatically restore library inventory availability.
  * `GET /api/borrow/my-loans`: Active loans and past borrowing history for current user.
  * `GET /api/borrow/all`: Admin-level transaction log.
* **Features**:
  * 14-day loan lending period with due date tracking.
  * Overdue detection with late fine calculations (₹5/day).
  * Real-time notifications powered by **Socket.IO** broadcasting additions, updates, deletions, borrowings, and returns.
  * Modular **Brevo (Sendinblue)** transactional email service configured on the backend for registration welcome emails, borrowing confirmations, and return receipts.

---

## 4. Complete Admin Dashboard

Accessible at **`/admin`** for users with the `admin` role:

1. **System Overview**:
   * Metrics for total books, available books, borrowed books, registered patrons, and total catalog valuation.
   * Recent lending activity feed.
2. **Book Inventory Management**:
   * Interactive table with book details, cover badges, price, and status.
   * Add book form modal with full validation.
   * Edit book modal prefilled with current book values.
   * Delete book with confirmation modal.
   * Direct 1-click toggle for availability.
3. **Patron & User Management**:
   * View all registered members and administrators.
   * View individual user loan history and active checkouts.
   * Role assignment (Promote to Admin / Demote to Member with safety guard against demoting the sole remaining admin).
   * Account activation and deactivation toggle.
4. **Lending Transactions**:
   * Full ledger of all borrow records.
   * Filter by status (Currently Borrowed, Returned, Overdue).
   * One-click "Confirm Return" to process returns on behalf of patrons.

---

## 5. Environment Configuration

### Backend (`backend/.env`)
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.qnqldi6.mongodb.net/libraryDB
PORT=5000
CLIENT_URL=http://localhost:5273,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5273
JWT_SECRET=super_secret_library_hub_jwt_key_2026_secure
BREVO_API_KEY=your_optional_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@libraryhub.local
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000
```


---

## 6. Experiment 09: Production Deployment

The project is structured and configured for automated cloud deployment:

### A. Frontend Deployment (Vercel)
* **Configuration**: Configured via [`vercel.json`](file:///c:/Users/prana/Downloads/library-management-system-corrected/library-management-system/vercel.json) and [`.vercelignore`](file:///c:/Users/prana/Downloads/library-management-system-corrected/library-management-system/.vercelignore).
* **SPA Routing**: Handles React Router deep links (`/search-books`, `/statistics`, `/login`, `/admin`, `/my-books`) by rewriting all requests to `/index.html`.
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Environment Variable**:
  * `VITE_API_URL`: Your deployed Render backend URL (e.g., `https://libraryhub-api.onrender.com`).

#### Steps to Deploy Frontend on Vercel:
1. Push your repository to GitHub or install the Vercel CLI (`npm install -g vercel`).
2. Run `vercel` from the `library-management-system` folder.
3. In Project Settings > Environment Variables, add `VITE_API_URL=https://<your-render-backend-url>`.
4. Deploy.

### B. Backend Deployment (Render)
* **Configuration**: Configured via [`render.yaml`](file:///c:/Users/prana/Downloads/library-management-system-corrected/library-management-system/render.yaml).
* **Service Type**: Web Service (Node.js environment).
* **Build Command**: `npm install`
* **Start Command**: `node server.js`
* **WebSockets**: Render automatically supports Socket.IO persistent connections.
* **CORS**: Set `CLIENT_URL` in the Render dashboard to your Vercel frontend URL.

#### Required Backend Environment Variables on Render:
| Variable | Value / Description |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` (or dynamically allocated by Render) |
| `MONGO_URI` | Your MongoDB Atlas connection URI |
| `CLIENT_URL` | Your Vercel frontend domain (e.g., `https://your-app.vercel.app`) |
| `JWT_SECRET` | Strong cryptographic secret |
| `BREVO_API_KEY` | *(Optional)* Your Brevo API key for transactional emails |
| `BREVO_SENDER_EMAIL` | `noreply@libraryhub.local` |
| `BREVO_SENDER_NAME` | `LibraryHub Notifications` |

---

## 7. Experiment 10: Docker & Containerization

Complete multi-container production orchestration using Docker and Docker Compose without requiring a local database (directly uses MongoDB Atlas):

### Files Included:
* **Frontend Dockerfile** ([`Dockerfile`](file:///c:/Users/prana/Downloads/library-management-system-corrected/library-management-system/Dockerfile)): Multi-stage build (Node.js 20 build stage + Nginx Alpine runtime stage with Gzip and SPA routing via [`nginx.conf`](file:///c:/Users/prana/Downloads/library-management-system-corrected/library-management-system/nginx.conf)).
* **Backend Dockerfile** ([`backend/Dockerfile`](file:///c:/Users/prana/Downloads/library-management-system-corrected/library-management-system/backend/Dockerfile)): Minimal Node.js 20 Alpine production image with healthcheck.
* **Docker Compose** ([`docker-compose.yml`](file:///c:/Users/prana/Downloads/library-management-system-corrected/library-management-system/docker-compose.yml)): Defines network, environment variables, healthchecks, and service dependencies.

### Docker Commands:

#### 1. Build and Run Containers
```bash
# From library-management-system directory:
docker compose up -d --build
```

#### 2. View Real-Time Logs
```bash
docker compose logs -f
```

#### 3. Stop Containers
```bash
docker compose down
```

#### 4. Restart Containers
```bash
docker compose restart
```

#### 5. Verify Health Status
```bash
docker compose ps
```
The frontend is mapped to **`http://localhost:5273`** and backend to **`http://localhost:5000`**.
