# 🎓 Edumerge – Admission Management & CRM

A full-stack MERN web application for managing college admissions with quota-wise seat control, applicant tracking, document verification, fee status, and admission number generation.

---

## 🚀 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, React Router v6, CSS Modules, Recharts |
| Backend   | Node.js, Express.js (single `server.js`) |
| Database  | MongoDB (viewable via MongoDB Compass)  |
| Auth      | JWT (JSON Web Tokens) + bcryptjs        |

---

## 📁 Project Structure


```
admission-crm/
├── backend/
│   ├── server.js          ← Single file: all models, routes, middleware
│   ├── .env               ← Environment variables
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── api.js                     ← Axios instance with JWT interceptor
        ├── App.js                     ← Root routing
        ├── index.js                   ← React entry point
        ├── context/
        │   └── AuthContext.js         ← Global auth state
        ├── components/
        │   ├── Navbar.js / .module.css
        │   ├── Sidebar.js / .module.css
        │   ├── Layout.js / .module.css
        │   ├── ProtectedRoute.js
        │   └── ui.module.css          ← Shared UI styles
        ├── pages/
        │   ├── Login.js / .module.css
        │   ├── Dashboard.js / .module.css
        │   ├── Applicants.js / .module.css
        │   ├── ApplicantForm.js / .module.css
        │   ├── ApplicantDetail.js / .module.css
        │   ├── SeatMatrix.js / .module.css
        │   └── Master.js / .module.css  ← Institution, Campus, Dept, Program, AY
        └── styles/
            └── global.css
```

---

## ⚙️ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v16+
- [npm](https://npmjs.com/) v8+
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally)
- [MongoDB Compass](https://www.mongodb.com/try/download/compass) (to view data visually)

---

## 🛠️ Setup & Installation

<<<<<<< HEAD


### 1. Backend Setup
=======
### 1. Clone / Download the project

```bash
cd admission-crm
```

---

### 2. Backend Setup
>>>>>>> 5d1cab2 (files update)

```bash
cd backend
npm install
```

**Configure environment (`.env` already included):**

```env
<<<<<<< HEAD
PORT=********
MONGO_URI=********
JWT_SECRET=********
=======
PORT=5000
MONGO_URI=mongodb://localhost:27017/admission_crm
JWT_SECRET=edumerge_secret_key_2026
>>>>>>> 5d1cab2 (files update)
```

**Start MongoDB** (make sure MongoDB is running locally):

```bash
# On Windows (if installed as service, it auto-starts)
# On Mac/Linux:
mongod
```

**Start the backend server:**

```bash
npm run dev       # Development (nodemon, auto-restart)
# OR
npm start         # Production
```

<<<<<<< HEAD
Server runs at: `http://localhost:5002`

On first start, **2 default users are auto-seeded** into MongoDB.
=======
Server runs at: `http://localhost:5000`

On first start, **3 default users are auto-seeded** into MongoDB.
>>>>>>> 5d1cab2 (files update)

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

<<<<<<< HEAD
> The `proxy` in `package.json` forwards `/api` calls to `http://localhost:5002` automatically.
=======
> The `proxy` in `package.json` forwards `/api` calls to `http://localhost:5000` automatically.
>>>>>>> 5d1cab2 (files update)

---

## 🔐 Default Login Credentials

| Role       | Email              | Password    | Access                        |
|------------|--------------------|-------------|-------------------------------|
| Admin      | admin@inst.edu     | admin123    | Full access (master setup)    |
| Officer    | officer@inst.edu   | officer123  | Applicants, seat allocation   |
| Management | mgmt@inst.edu      | mgmt123     | View-only (dashboard)         |

---

## 🗂️ Viewing Data in MongoDB Compass

1. Open **MongoDB Compass**
<<<<<<< HEAD
2. Connect to: `********`
=======
2. Connect to: `mongodb://localhost:27017`
>>>>>>> 5d1cab2 (files update)
3. Open database: **`admission_crm`**
4. Collections created automatically:
   - `users` — Login accounts
   - `institutions`, `campuses`, `departments`, `programs`, `academicyears` — Master data
   - `seatmatrices` — Quota configurations per program
   - `applicants` — Applicant records with status, documents, fee, admission number

---

## 🧭 User Journey (How to Demo)

### Journey 1: Admin — Master Setup
1. Login as **Admin**
2. Go to **Institution** → Add institution (Name: `Institute of Technology`, Code: `INST`, City: `Bangalore`)
3. Go to **Campus** → Add campus linked to institution
4. Go to **Department** → Add departments (CSE, ECE, etc.)
5. Go to **Programs** → Add programs with intake (e.g. B.E CSE, UG, Regular, 60 seats)
6. Go to **Academic Year** → Add `2026-27`
7. Go to **Seat Matrix** → Configure quotas:
   - KCET: 30 | COMEDK: 15 | Management: 15 (must sum to 60)

### Journey 2: Officer — Government Admission (KCET)
1. Login as **Admission Officer**
2. Go to **Applicants** → Click `+ New Applicant`
3. Fill in details, select **Quota: KCET**, **Mode: Government**, enter Allotment Number
4. Submit → Applicant created with status `Applied`
5. Click **View** on applicant → Click **🪑 Allocate Seat**
   - System checks quota availability in real-time
   - If quota full → Blocked with error message
6. Update **Document Checklist** to `Verified` for each document
7. Click **💰 Mark Fee Paid**
8. Click **🎓 Confirm Admission**
   - Unique Admission Number generated: `INST/2026/UG/CSE/KCET/0001`
   - Status → `Admitted`

### Journey 3: Management — Dashboard Monitoring
1. Login as **Management**
2. View Dashboard → See:
   - Total applicants, admitted count, fee pending, docs pending
   - Quota-wise bar chart (allocated vs remaining)
   - Applicant pipeline by status

---

## ✅ Key Business Rules Implemented

| Rule | Implementation |
|------|----------------|
| Quota seats ≤ total intake | Validated on seat matrix save |
| No seat allocation if quota full | Real-time check on `/allocate-seat` |
| Admission number generated only once | `sparse: true` + exists check |
| Admission confirmed only if fee paid | Fee check before confirmation |
| Admission number is unique & immutable | MongoDB unique constraint |
| Real-time seat counters | `allocated` counter increments atomically |
| Role-based access | JWT middleware (`protect`, `adminOnly`, `notManagement`) |

---

## 🌐 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/dashboard` | Dashboard stats |
| GET/POST | `/api/institutions` | Master: institutions |
| GET/POST | `/api/campuses` | Master: campuses |
| GET/POST | `/api/departments` | Master: departments |
| GET/POST | `/api/programs` | Master: programs |
| GET/POST | `/api/academic-years` | Master: academic years |
| GET/POST | `/api/seat-matrix` | Seat matrix config |
| GET/POST | `/api/applicants` | Applicant list / create |
| GET | `/api/applicants/:id` | Applicant detail |
| POST | `/api/applicants/:id/allocate-seat` | Lock seat (quota check) |
| PATCH | `/api/applicants/:id/documents` | Update document status |
| PATCH | `/api/applicants/:id/fee` | Mark fee paid |
| POST | `/api/applicants/:id/confirm-admission` | Generate admission number |

---

## 🤖 AI Assistance Disclosure

This project was built with assistance from **Claude (Anthropic)** for:
- Boilerplate code generation (Express routes, React components)
- CSS module styling
- MongoDB schema design

All business logic, data flow, quota validation rules, and application architecture were designed based on the Edumerge BRS specification. The code was reviewed and understood before submission.

---

## 📞 Contact

Submitted for: **Edumerge Junior Software Developer Assignment**  
Email: deepak@edumerge.com  
Subject: `Assignment for Junior Software Developer`
<<<<<<< HEAD
>>>>>>> 21f24c8 (Initial commit - Edumerge assignment)
=======
>>>>>>> 5d1cab2 (files update)
