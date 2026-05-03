# 💰 Expense Tracker – Full Stack Project Plan (Python Backend)

## 🎯 Objective

Build a production-ready full-stack Expense Tracker web application using Python for backend logic, with authentication, analytics, and deployment.

---

## 🧠 Product Vision

A modern personal finance app where users can:

* Track expenses
* Categorize spending
* View analytics
* Manage budgets

---

## 🏗️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Axios
* Recharts

### Backend (Python)

* FastAPI (high-performance API framework)
* SQLAlchemy (ORM)
* Pydantic (data validation)
* PostgreSQL (preferred) or SQLite (dev)

### Authentication

* JWT (python-jose)
* Password hashing (passlib / bcrypt)

### Deployment

* Frontend: Vercel / Netlify
* Backend: Render / Railway
* DB: PostgreSQL (Neon / Supabase / Railway)

---

## 📁 Project Structure

### Backend

```id="py-struct"
/server
  /app
    /api
      /routes
    /core
    /models
    /schemas
    /services
    /db
    /utils
  main.py
  requirements.txt
```

### Frontend

```id="fe-struct"
/client
  /components
  /pages
  /services
  /context
  /hooks
  App.jsx
```

---

## 🧩 Core Features (MVP)

### Authentication

* Register user
* Login user
* JWT-based protected routes

### Expense Management

* Add expense
* Edit expense
* Delete expense
* Fetch user-specific expenses

### Categories

Default:

* Food & Dining
* Groceries
* Transport
* Rent
* Utilities
* Education
* Shopping
* Entertainment
* Healthcare
* Bills
* Travel
* Investments
* Subscriptions
* EMI
* Gifts
* Others

Also:

* Allow custom categories

### Dashboard

* Monthly total spending
* Category-wise breakdown
* Recent transactions

---

## 🚀 Advanced Features

### Insights

* Monthly comparison
* Spending trends
* Category distribution

### Budget System

* Monthly budget limit
* Remaining budget calculation
* Alerts

### UX

* Dark mode and light mode toggle switch
* Responsive UI
* Loading & error states

---

## 🗄️ Database Schema

### User

```json
{
  "id": "int",
  "name": "string",
  "email": "string",
  "hashed_password": "string",
  "created_at": "datetime"
}
```

### Expense

```json
{
  "id": "int",
  "user_id": "int",
  "amount": "float",
  "category": "string",
  "date": "datetime",
  "description": "string"
}
```

### Budget

```json
{
  "id": "int",
  "user_id": "int",
  "monthly_limit": "float",
  "month": "string"
}
```

---

## 🔌 API Design

### Auth

* POST /auth/register
* POST /auth/login

### Expenses

* GET /expenses
* POST /expenses
* PUT /expenses/{id}
* DELETE /expenses/{id}

### Budget

* GET /budget
* POST /budget

---

## 🔐 Backend Components

### Models (SQLAlchemy)

* Define DB tables

### Schemas (Pydantic)

* Request/response validation

### Services

* Business logic layer

### Routes

* API endpoints

### Core

* Config (env vars, JWT secret)

### DB

* Database connection & session

---

## ⚙️ Development Workflow

### Phase 1: Backend (Python)

1. Setup FastAPI app
2. Setup PostgreSQL connection
3. Create models (User, Expense, Budget)
4. Implement authentication (JWT)
5. Build CRUD APIs
6. Test using Swagger UI (/docs)

### Phase 2: Frontend

1. Setup React (Vite)
2. Build auth pages
3. Build dashboard UI
4. Integrate APIs
5. Add charts

### Phase 3: Integration

* Connect frontend + backend
* Handle errors/loading

### Phase 4: Enhancement

* Budget tracking
* Insights
* UI polish

### Phase 5: Deployment

* Deploy backend (Render)
* Deploy frontend (Vercel)
* Setup environment variables

---

## 🎨 UI Requirements

* Sidebar navigation
* Dashboard with charts
* Clean and minimal design
* Mobile responsive

---

## 🧪 Testing

* API testing via Swagger/Postman
* Auth flow testing
* Data isolation per user

---

## 📦 Environment Variables

### Backend

```id="env-backend"
DATABASE_URL=
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend

```id="env-frontend"
VITE_API_URL=
```

---

## 🚨 Constraints

* Clean architecture (separation of concerns)
* No hardcoding
* Proper error handling
* RESTful APIs

---

## ⭐ Stretch Goals

* CSV export
* Recurring expenses
* Smart insights
* Category auto-suggestions

---

## ✅ Deliverables

* Working full-stack app
* Deployed version
* GitHub repo with README

---

## ⚡ Instruction to LLM

* Follow layered architecture strictly
* Use FastAPI best practices
* Keep code modular and reusable
* Generate production-level code
* Do not skip validation or error handling



⚙️ Phase 1: Backend (Python FastAPI) — DETAILED EXECUTION PLAN

This phase decides whether your project looks like a real backend system or just a college demo.

🎯 Goal of Phase 1

Build a fully functional backend with:

Authentication (JWT)
Expense CRUD
Clean architecture (models, schemas, services)
Database integration
Tested APIs
🧱 Step 1: Project Initialization
What LLM should do:
Create project folder: /server
Initialize Python environment
Create requirements.txt
Required Dependencies:
fastapi
uvicorn
sqlalchemy
psycopg2-binary
pydantic
python-jose
passlib[bcrypt]
python-dotenv
Expected Output:
Virtual environment setup instructions
requirements.txt file
🧱 Step 2: Folder Structure Setup

LLM must generate this EXACT structure:

/server
  /app
    /api/routes
    /core
    /models
    /schemas
    /services
    /db
    /utils
  main.py
Important Rule:
NO business logic inside routes
NO DB logic inside schemas
🧱 Step 3: Database Setup
Tasks:
Configure PostgreSQL connection
Create session.py
Create base.py
LLM should:
Use SQLAlchemy engine
Create session dependency
Load env variables
Output:
DB connection module
Session generator function
🧱 Step 4: Models (SQLAlchemy)
Required Models:
User Model
id
name
email (unique)
hashed_password
created_at
Expense Model
id
user_id (foreign key)
amount
category
description
date
Budget Model
id
user_id
monthly_limit
month
LLM must:
Define relationships
Use proper datatypes
Add indexing where needed
🧱 Step 5: Schemas (Pydantic)
Separate schemas:
Request schemas (Create, Update)
Response schemas

Example:

UserCreate
UserLogin
ExpenseCreate
ExpenseResponse
Rules:
NEVER expose password
Use validation (min/max, types)
🧱 Step 6: Authentication System 🔐

This is critical.

LLM must implement:
Password Handling
Hash password (bcrypt)
Verify password
JWT
Create access token
Decode token
Expiry handling
Dependency
get_current_user
🧱 Step 7: API Routes
Auth Routes
POST /auth/register
POST /auth/login
Expense Routes (Protected)
GET /expenses
POST /expenses
PUT /expenses/{id}
DELETE /expenses/{id}
Budget Routes
GET /budget
POST /budget
🧱 Step 8: Service Layer (IMPORTANT)

Most people skip this—don’t.

Create:
auth_service.py
expense_service.py
budget_service.py
Responsibility:
Business logic ONLY
Routes call services
Services call DB
🧱 Step 9: Middleware & Error Handling
LLM should implement:
Global exception handler
Validation errors
Unauthorized access handling
🧱 Step 10: Main App Setup
main.py should:
Initialize FastAPI
Include routers
Add CORS middleware
Startup event (DB check)
🧪 Step 11: Testing
Must test using:
Swagger (/docs)
Postman
Test cases:
Register user
Login user
Add expense
Unauthorized access blocked
📦 Phase 1 Final Output Checklist

LLM output is COMPLETE only if:

✅ Clean folder structure
✅ Working JWT auth
✅ CRUD APIs functional
✅ DB connected
✅ Swagger working
✅ No logic mixing
🚨 Common Mistakes (LLM must avoid)
❌ Writing everything in one file
❌ Skipping service layer
❌ No validation
❌ Storing plain passwords
❌ No user-based filtering
🎯 Strict Instruction to LLM
Build backend in modular architecture:
- Routes → Services → Models
- Use dependency injection
- Ensure security best practices
- Code must be production-ready, not tutorial-style




⚙️ Phase 2: Frontend (React) — DETAILED EXECUTION PLAN
🎯 Goal of Phase 2

Build a clean, responsive, production-ready UI that:

Authenticates users
Displays expense data visually
Communicates properly with backend APIs
Feels like a real product
🧱 Step 1: Project Setup
LLM should:
Create React app using Vite
Install dependencies
Required Dependencies:
npm create vite@latest client -- --template react
cd client
npm install axios react-router-dom recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
🧱 Step 2: Folder Structure (IMPORTANT)
/client
  /src
    /components
    /pages
    /services
    /context
    /hooks
    /utils
    App.jsx
    main.jsx
🧱 Step 3: Routing Setup

Use react-router-dom

Routes:
/login
/register
/dashboard
/expenses
Rules:
Protect private routes
Redirect if not authenticated
🧱 Step 4: Authentication System
LLM must implement:
Auth Context
Store JWT token
Store user state
Provide login/logout functions
Local Storage
Persist token
Axios Interceptor
Automatically attach token to headers
🧱 Step 5: API Service Layer

Create:

services/api.js
Responsibilities:
Axios instance
Base URL from env
Interceptors (auth + error)
🧱 Step 6: Pages (Core UI)
1. Login Page
Email + Password
Call /auth/login
2. Register Page
Name + Email + Password
Call /auth/register
3. Dashboard Page
Total expenses
Charts (pie + bar)
Recent transactions
4. Expenses Page
List all expenses
Add / Edit / Delete
🧱 Step 7: Components
Must create reusable components:
Navbar / Sidebar
Expense Card
Expense Form (modal or page)
Chart Components
Loader + Error components
🧱 Step 8: Charts (Important for Resume)

Use Recharts

Required:
Pie chart → category distribution
Bar chart → monthly spending
🧱 Step 9: State Management

Keep it simple but clean:

Auth → Context API
Expenses → local state or custom hooks
🧱 Step 10: UI/UX (THIS IS WHERE YOU WIN)
Must include:
Tailwind styling
Responsive design
Clean layout (sidebar + content)
Dark mode toggle
🧱 Step 11: Error Handling
API errors
Form validation
Loading states
🧱 Step 12: Integration
Connect all APIs
Ensure:
Token sent in headers
Data updates reflect instantly
🧱 Step 13: Environment Setup
VITE_API_URL=http://localhost:8000
🧪 Phase 2 Checklist
✅ Auth works
✅ Protected routes
✅ API integration
✅ Charts working
✅ Clean UI
🚨 Common Mistakes
❌ No structure (everything in one file)
❌ No auth persistence
❌ Hardcoded API URLs
❌ Ugly UI (kills impression)
🔥 PART 2: LLM PROMPTS FOR PHASE 2

You can feed these step-by-step 👇

🧠 Prompt 1: Setup
Create a React frontend using Vite for an Expense Tracker app.

Requirements:
- Use functional components
- Use Tailwind CSS
- Install axios, react-router-dom, recharts
- Setup clean folder structure:
  components, pages, services, context, hooks

Do not write everything in one file.
Keep code modular and production-ready.
🧠 Prompt 2: Routing + Auth Context
Implement routing using react-router-dom.

Requirements:
- Routes: /login, /register, /dashboard, /expenses
- Create protected routes (only accessible if logged in)
- Create AuthContext:
  - Store JWT token
  - Store user info
  - Provide login/logout functions
- Persist token using localStorage

Ensure clean and scalable implementation.
🧠 Prompt 3: API Layer
Create an API service layer using axios.

Requirements:
- Create axios instance
- Base URL from environment variable (VITE_API_URL)
- Add interceptor to attach JWT token
- Handle API errors globally

Keep it modular and reusable.
🧠 Prompt 4: Auth Pages
Create Login and Register pages.

Requirements:
- Forms with validation
- Call backend APIs (/auth/login, /auth/register)
- Store token on login
- Redirect to dashboard after login
- Show error messages

Use Tailwind for clean UI.
🧠 Prompt 5: Dashboard
Create a dashboard page.

Requirements:
- Show total expenses
- Show category-wise pie chart
- Show monthly bar chart
- Fetch data from backend

Use Recharts for charts.
Keep UI clean and responsive.
🧠 Prompt 6: Expense Management
Create expense management UI.

Requirements:
- List all expenses
- Add expense form
- Edit expense
- Delete expense
- Connect with backend APIs

Ensure proper state updates and clean UI.
🧠 Prompt 7: UI Polish
Improve UI/UX of the app.

Requirements:
- Add sidebar navigation
- Add dark mode toggle
- Add loading states
- Add error handling UI
- Ensure responsiveness

Make it look like a production-level app.
🎯 Final Reality Check

If you:

Just display data → ❌ average
Add charts + clean UI → ✅ good
Add polish + UX + structure → 🔥 standout