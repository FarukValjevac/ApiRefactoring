# Membership API Refactoring

In this branch I have corrected all bugs and added some additional features explained in [Task 1](Backend/README.md)

## 📋 Table of Contents

- [Setup](#setup)
- [Task 1 – Backend Modernization](Backend/README.md)
- [Task 2 – Architecture Overview](Arch/README.md)

## Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/FarukValjevac/ApiRefactoring.git
   cd eversports-nest
   ```

2. **Navigate to the backend and install dependencies:**

   ```bash
   cd backend
   npm install
   ```

3. **Create your .env file in the backend directory:**

   ```bash
   # secret .env variables should never be provided in the README
   PORT=3000
   ```

4. **Build the backend:**

   ```bash
   npm run build
   ```

5. **Start the backend development server:**

   ```bash
   npm run start:nest:dev  # for NestJS backend
   npm run start:express   # for Express backend (legacy)
   ```

6. **Run backend tests:**

   ```bash
   npm run test
   ```

7. **Navigate to the frontend and install dependencies:**

   ```bash
   cd ../frontend
   npm install
   ```

8. **Start the frontend development server:**

   ```bash
   npm run dev
   ```

9. **Run frontend tests:**
   ```bash
   npm run test
   ```

The frontend will run on `http://localhost:5173/`, and the backend on `http://localhost:3000`.

NOTE: The README files for Task 1 and Task 2 can be found in their respective directories. They are also linked in the table of content.
