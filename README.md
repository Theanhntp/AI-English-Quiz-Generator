# AI English Quiz Generator

## 🧠 Overview

This is a full-stack web application for generating AI-powered English quizzes. Teachers can upload documents (PDF, DOCX, TXT), and the system uses OpenAI and vector search (Qdrant) to generate context-aware quizzes. Students can take quizzes, view results, and improve through adaptive difficulty logic.

---

## 📁 Monorepo Structure

```
AI-ENGLISH-QUIZ-GENERATOR/
├── client/         # React 18 + Vite frontend
├── server/         # Node.js Express backend
├── shared/         # Shared types & schemas
├── database/       # MongoDB schema and seed
├── attached_assets/# Docs or static assets
├── .env.example    # Sample env config
└── README.md       # You are here
```

---

## 🧰 Technology Stack

* **Frontend**: React 18, Vite, TailwindCSS, Zustand, TanStack Query, shadcn/ui
* **Backend**: Node.js 20, Express, Passport.js (auth), Multer (uploads)
* **Database**: MongoDB (Mongoose), Qdrant (RAG), Drizzle (PostgreSQL if needed)
* **AI Services**: OpenAI GPT-4o + Embedding API

---

## 🔐 Authentication

* Passport.js session-based auth
* Roles: `teacher`, `student`
* Secure cookie settings

---

## ✍️ Core Features

### Teacher

* Upload materials (PDF/DOCX/TXT)
* Configure and generate quizzes
* Track student attempts and results

### Student

* Take quizzes from dashboard
* Submit and view scored results
* Get smarter questions via adaptive difficulty

---

## 🔁 Quiz Generation Flow

1. Teacher uploads learning material
2. Text is extracted and chunked (\~300 tokens)
3. Chunks embedded via OpenAI → stored in Qdrant
4. When generating quiz:

   * Top-k relevant chunks retrieved
   * Prompt crafted and sent to GPT-4o
   * Response parsed into quiz JSON

---

## 📊 Adaptive Difficulty

* Elo rating system (per student + per question)
* Quiz difficulty adjusts based on student's level
* Stored and recalculated after each quiz attempt

---

## 📦 API Endpoints

| Method | Route               | Description                    |
| ------ | ------------------- | ------------------------------ |
| POST   | `/auth/signup`      | Register (student/teacher)     |
| POST   | `/auth/login`       | Login with JWT/session         |
| POST   | `/materials/upload` | Upload learning documents      |
| POST   | `/quiz/generate`    | Generate quiz from material    |
| GET    | `/quiz/:id`         | Get quiz by ID                 |
| POST   | `/quiz/:id/submit`  | Submit answers + receive score |

---

## 🧪 Sample curl for Testing

```bash
curl -X POST http://localhost:3000/quiz/generate \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "abc123",
    "questionCount": 5,
    "questionTypes": ["mcq", "fill", "truefalse"],
    "difficultyLevel": "intermediate"
  }'
```

---

## 🛠️ Setup & Installation

### 🧩 Prerequisites

* Node.js >= 20
* MongoDB >= 7 (or PostgreSQL if using Drizzle)
* Qdrant >= 1.8
* OpenAI API Key

### 🔧 Install Dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### ▶️ Running the App

```bash
# Start Qdrant
qdrant --uri 127.0.0.1:6333 &

# Start backend
cd server && node index.ts

# Start frontend
cd ../client && npm run dev
```

---