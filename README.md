# NextStep — AI Decision Assistant

NextStep is a full-stack AI decision assistant that helps users turn messy or stressful situations into a clear next step.

The application accepts a user's situation, sends it to the NextStep API, stores the resulting analysis in MongoDB, asks clarifying questions when required, and allows users to submit answers or update their situation.

---

## Features

- Describe a situation in natural language
- Generate an AI-powered situation analysis
- Identify issues and priorities
- Ask clarifying questions when more information is required
- Submit answers to clarifying questions
- Update an existing situation when circumstances change
- Display the recommended next action
- Store situations and complete version history in MongoDB
- Handle unreliable API responses
- Handle API timeouts
- Handle malformed JSON responses
- Handle HTTP errors such as 429, 500, 502, 503 and 504
- Use idempotency keys for state-changing API requests
- Provide loading and error feedback in the frontend

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Zod

### External API

NextStep Mock API:

`https://nextstepmockapi.onrender.com`

---

## Project Structure

```text
NextStep-FullStack/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── ...
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── situationController.js
│   ├── models/
│   │   └── Situation.js
│   ├── routes/
│   │   └── situationRoutes.js
│   ├── services/
│   │   └── nextStepService.js
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── .env
├── .env.example
├── .gitignore
└── README.md