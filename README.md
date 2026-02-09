## Store Ratings Platform

This is a full-stack web application for managing stores and user ratings, with role-based access for:

- **System Administrator**
- **Normal User**
- **Store Owner**

Backend: **Express + Sequelize + PostgreSQL**  
Frontend: **React (Vite)**

---

### Backend Setup

1. **Create `.env` in `backend`**

```bash
cd backend
cp .env.example .env  # or create manually
```

Create `.env` with:

```bash
PORT=4000
JWT_SECRET=change-me

DB_HOST=localhost
DB_PORT=5432
DB_NAME=fs_challenge
DB_USER=postgres
DB_PASSWORD=postgres
```

2. **Install dependencies and run**

```bash
cd backend
npm install
npm run dev
```

On first run, Sequelize will automatically create tables using `sequelize.sync()`.

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to `http://localhost:4000/api`.

---

### User Roles & Flows

- **System Administrator**
  - Logs in via `/login`
  - Can create users (Admin / Normal / Store Owner) and stores
  - Sees dashboard stats (total users, stores, ratings)
  - Can list and filter users by Name, Email, Address, Role
  - Can list and filter stores by Name, Email, Address, with overall rating

- **Normal User**
  - Signs up via `/signup` with:
    - Name (20–60 chars)
    - Email (valid format)
    - Address (≤ 400 chars)
    - Password (8–16 chars, at least 1 uppercase and 1 special character)
  - Logs in and is redirected to the `Stores` page
  - Can search stores by Name and Address
  - For each store sees:
    - Store Name
    - Address
    - Overall Rating
    - Their own submitted rating
    - Can submit or modify rating (1–5)

- **Store Owner**
  - Logs in and is redirected to the Owner Dashboard
  - Sees their stores, average rating, and list of users who rated them (Name, Email, Address, Rating)

All tables support sorting by key fields via clickable column headers.

---

### Notes

- Password and form validations are enforced on **both frontend and backend**.
- Database schema:
  - `users`: `id`, `name`, `email`, `passwordHash`, `address`, `role`
  - `stores`: `id`, `name`, `email`, `address`, `ownerId`
  - `ratings`: `id`, `rating`, `UserId`, `StoreId`
- Ratings are 1–5 and unique per (User, Store) pair.

