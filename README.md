Final version will be available on Monday morning :)

## Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/FarukValjevac/ApiRefactoring.git
    cd eversports-nest
    ```

2.  **Navigate to the backend and install dependencies:**

    ```bash
    cd backend
    npm install
    ```

    **Before starting ensure to create your own .env file in the frontend directory**

    ```bash
    # Obviously this data should not be shared in real life.

    PORT=3000
    ```

3.  **Build the backend:**

    ```bash
    npm run build
    ```

4.  **Start the backend development server:**

    ```bash
    start:nest:dev // for nest backend
    ```

    ```bash
    start:express // for express backend
    ```

5.  **Run tests:**

    ```bash
    $ npm run test
    ```

6.  **Navigate to the frontend and install dependencies:**

    ```bash
    cd ../frontend
    npm install
    ```

7.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
8.  **Run test:**
    ```bash
    npm run test
    ```

The frontend will run on `http://localhost:5173/`, and the backend on `http://localhost:3000`.

## ✅ Task 1 – Refactor Legacy Endpoints

### 🎯 Goal

Refactor legacy Express endpoints `/legacy/memberships` (GET & POST) into a modern, maintainable NestJS backend using TypeScript, separating business logic, ensuring validation, and maintaining original functionality and output structure.

### 🛠️ Technologies Used

- **NestJS** – Modular server-side framework for Node.js
- **TypeScript** – Strong typing and developer tooling
- **uuid** – For generating unique identifiers
- **Mock JSON Files** – Used to simulate a database

### 📌 Endpoints

#### POST `/memberships`

Creates a new membership and auto-generates billing periods based on business rules.

**Example Request Body:**

```json
{
  "name": "Gold Plan",
  "recurringPrice": 60,
  "paymentMethod": "credit card",
  "billingInterval": "monthly",
  "billingPeriods": 6,
  "validFrom": "2024-07-01"
}
```

Example Response:

```json
{
  "membership": {
    "id": 4,
    "uuid": "192542ac-d300-415d-9626-852f3412c875",
    "name": "Gold Plan",
    "state": "expired",
    "validFrom": "2024-07-01T00:00:00.000Z",
    "validUntil": "2025-01-01T01:00:00.000Z",
    "userId": 2000,
    "paymentMethod": "credit card",
    "recurringPrice": 60,
    "billingPeriods": 6,
    "billingInterval": "monthly"
  },
  "membershipPeriods": [
    {
      "id": 4,
      "uuid": "06e4a745-80e1-4144-bff7-e377966a2d63",
      "membership": 4,
      "start": "2024-07-01T00:00:00.000Z",
      "end": "2024-08-01T00:00:00.000Z",
      "state": "issued"
    },
    {
      // and all the other billing periods one under another.
    }
  ]
}
```

#### GET /memberships

Returns a list of all stored memberships along with their billing periods.

### 🤔 Assumptions

- Mock JSON data simulates persistent storage
- No external DB used in Task 1
- IDs are generated using `uuid`
- Error messages match those from legacy Express app

### ⏱️ Time Estimation – Task 1 (Productive work)

| Phase                      | Time          |
| :------------------------- | :------------ |
| Setup & analysis           | ~30 mins      |
| Backend                    | ~4:30 hrs     |
| Testing                    | ~30 mins      |
| <u>**Initial Total**</u>   | **~5:30 hrs** |
| Frontend                   | 4 hrs         |
| Github Actions + Bugfixing | 2 hrs         |
| Testing                    | 30 mins       |
| <u>**Total**</u>           | **~12 hrs**   |

---

### 📌 Final Notes

This project demonstrates:

- Clean **separation of concerns** in a NestJS backend
- Robust **input validation** and **type safety**
- Assumptions documented transparently
- Reasonable time spent on both coding and design

📦 Ready for DB or cloud integration, if expanded.

### 🤔 Decision making

TBA

## ✅ Task 2 – Membership Export Architecture

### 🎯 Goal

The goal of this task is to design a stable and scalable asynchronous process for exporting user membership data to CSV files and delivering them via email upon API request.

TBA
